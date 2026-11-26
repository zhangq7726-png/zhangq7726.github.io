'use strict';

const questions = sections.flatMap(({ title, questions: items }) =>
  items.map(([prompt, options]) => ({ section: title, prompt, options }))
);

const get = (id) => document.getElementById(id);
const views = ['home', 'quiz', 'result'];
const answerLetters = ['A', 'B', 'C', 'D'];
const state = { index: 0, answers: [], view: 'home', profile: null };
const artwork = get('landscape');
get('poster-download').href = '#';
document.querySelector('.poster-landscape').style.backgroundImage = 'url("' + artwork.src + '")';

function scoreAnswers(answers) {
  const scores = Object.fromEntries(Object.keys(traits).map((id) => [id, 0]));
  const topics = Object.fromEntries(Object.keys(traits).map((id) => [id, new Set()]));
  const lastSeen = Object.fromEntries(Object.keys(traits).map((id) => [id, -1]));

  questions.forEach(({ section, options }, index) => {
    const [id] = options[answers[index]];
    scores[id] += 1;
    topics[id].add(section);
    lastSeen[id] = index;
  });

  // 总分并列时，依次比较核心倾向的次数、覆盖主题数、最近一次选择。
  const ranks = profiles.map((profile, order) => {
    const [core, first, second] = profile.weights;
    return {
      profile,
      order,
      total: 4 * scores[core] + 2 * scores[first] + scores[second],
      coreCount: scores[core],
      breadth: topics[core].size,
      lastPick: lastSeen[core]
    };
  });
  ranks.sort((a, b) =>
    b.total - a.total ||
    b.coreCount - a.coreCount ||
    b.breadth - a.breadth ||
    b.lastPick - a.lastPick ||
    a.order - b.order
  );
  return { profile: ranks[0].profile, scores, ranks };
}

function showView(name) {
  state.view = name;
  views.forEach((view) => { get(view).hidden = name !== view; });
  window.scrollTo(0, 0);
}

function animate(element) {
  element.classList.remove('enter');
  void element.offsetWidth;
  element.classList.add('enter');
}

function showHome() {
  const canResume = state.answers.length > 0 && !state.profile;
  get('start').textContent = canResume ? '继续测试' : '开始测试';
  showView('home');
  animate(get('home'));
  get('home-title').focus({ preventScroll: true });
}

function resetQuiz() {
  state.index = 0;
  state.answers = [];
  state.profile = null;
}

function updateProgress() {
  const completed = state.answers.filter(Number.isInteger).length;
  get('progress').value = completed;
  get('progress-text').textContent = '已答 ' + completed + ' / ' + questions.length + ' 题';
  get('next').disabled = state.answers[state.index] === undefined;
}

function renderQuestion() {
  const current = questions[state.index];
  get('topic').textContent = current.section;
  get('question-count').textContent = '第 ' + (state.index + 1) + ' 题';
  get('question-title').textContent = current.prompt;
  get('options').replaceChildren(...current.options.map(([, text], index) => {
    const label = document.createElement('label');
    label.className = 'option';
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'answer';
    input.value = index;
    input.checked = state.answers[state.index] === index;
    const letter = document.createElement('span');
    letter.className = 'option-letter';
    letter.textContent = answerLetters[index];
    letter.setAttribute('aria-hidden', 'true');
    const description = document.createElement('span');
    description.textContent = text;
    label.append(input, letter, description);
    return label;
  }));
  get('previous').disabled = state.index === 0;
  get('next').textContent = state.index === questions.length - 1 ? '查看结果' : '下一题';
  updateProgress();
  animate(get('question-card'));
  window.scrollTo(0, 0);
  get('question-title').focus({ preventScroll: true });
}

function setTags(list, tags) {
  list.replaceChildren(...tags.map((tag) => {
    const item = document.createElement('li');
    item.textContent = tag;
    return item;
  }));
}

function renderResult() {
  const { profile } = scoreAnswers(state.answers);
  state.profile = profile;
  get('result-title').textContent = profile.name;
  get('result-role').textContent = profile.period;
  get('result-seal').textContent = profile.seal;
  get('result-quote').textContent = profile.quote;
  get('result-reason').textContent = profile.reason;
  get('result-strength').textContent = profile.strength;
  get('result-egg').textContent = profile.egg;
  get('share-card').style.setProperty('--result-color', profile.color);
  setTags(get('result-tags'), profile.tags);
  setTags(get('poster-tags'), profile.tags);
  get('save-status').textContent = '';
  showView('result');
  animate(get('result'));
  get('result-title').focus({ preventScroll: true });
}

function paintLandscape(context, image, top, height) {
  const width = context.canvas.width;
  const sourceHeight = image.naturalWidth * height / width;
  const sourceTop = (image.naturalHeight - sourceHeight) * .80;
  context.drawImage(image, 0, sourceTop, image.naturalWidth, sourceHeight, 0, top, width, height);
  const fade = context.createLinearGradient(0, top, 0, top + height);
  fade.addColorStop(0, '#f4ead9');
  fade.addColorStop(.35, '#f4ead900');
  fade.addColorStop(.80, '#f4ead900');
  fade.addColorStop(1, '#f4ead9');
  context.fillStyle = fade;
  context.fillRect(0, top, width, height);
}

function paintQuote(context, text, x, y, maxWidth, lineHeight) {
  let line = '';
  let lines = 1;
  for (const character of text) {
    if (line && context.measureText(line + character).width > maxWidth && !'，。！？、；：'.includes(character)) {
      context.fillText(line, x, y);
      y += lineHeight;
      lines += 1;
      line = '';
    }
    line += character;
  }
  context.fillText(line, x, y);
  return lines;
}

async function buildPoster(profile) {
  await artwork.decode();
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1440;
  const context = canvas.getContext('2d');
  const { width, height } = canvas;
  const style = getComputedStyle(document.documentElement);
  const serif = style.getPropertyValue('--serif').trim();
  const sans = style.getPropertyValue('--sans').trim();
  context.fillStyle = '#f4ead9';
  context.fillRect(0, 0, width, height);
  paintLandscape(context, artwork, 745, 635);

  context.lineWidth = 2;
  context.strokeStyle = '#a28d6f';
  context.strokeRect(34, 34, width - 68, height - 68);
  context.strokeStyle = '#c6b59a';
  context.strokeRect(47, 47, width - 94, height - 94);
  context.fillStyle = '#564c3d';
  context.font = '30px ' + sans;
  context.fillText('脑洞星球', 91, 119);
  context.textAlign = 'right';
  context.fillText('我的测试结果', width - 91, 119);
  context.strokeStyle = '#c6b59a';
  context.beginPath();
  context.moveTo(91, 150);
  context.lineTo(width - 91, 150);
  context.stroke();
  context.textAlign = 'left';
  context.fillText('我的灵魂对应', 91, 234);

  context.fillStyle = profile.color;
  context.font = 'bold 148px ' + serif;
  context.fillText(profile.name, 84, 405);
  context.save();
  context.translate(width - 155, 346);
  context.rotate(.12);
  context.lineWidth = 4;
  context.strokeStyle = profile.color;
  context.strokeRect(-52, -58, 104, 116);
  context.lineWidth = 2;
  context.strokeRect(-43, -49, 86, 98);
  context.font = 'bold 58px ' + serif;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(profile.seal, 0, 0);
  context.restore();

  context.fillStyle = '#564c3d';
  context.font = '34px ' + sans;
  context.fillText(profile.period, 91, 474);
  context.fillStyle = '#292922';
  context.font = 'bold 45px ' + serif;
  const lines = paintQuote(context, profile.quote, 113, 563, 866, 63);
  context.fillStyle = profile.color;
  context.fillRect(91, 524, 4, 51 + (lines - 1) * 63);

  let tagX = 91;
  const tagY = 615 + (lines - 1) * 63;
  context.font = '30px ' + sans;
  context.lineWidth = 2;
  context.strokeStyle = '#a28d6f';
  for (const tag of profile.tags) {
    const tagWidth = context.measureText(tag).width + 39;
    context.strokeRect(tagX, tagY, tagWidth, 54);
    context.fillText(tag, tagX + 19, tagY + 38);
    tagX += tagWidth + 12;
  }

  context.fillStyle = '#463f33';
  context.textAlign = 'center';
  context.font = '30px ' + sans;
  context.fillText('测测你的灵魂对应哪位中国历史人物', width / 2, 1359);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('无法生成分享图片'));
    }, 'image/png');
  });
}

get('brand').addEventListener('click', showHome);
get('about-open').addEventListener('click', () => get('about').showModal());
get('start').addEventListener('click', () => {
  if (state.profile) resetQuiz();
  showView('quiz');
  renderQuestion();
});
get('options').addEventListener('change', (event) => {
  state.answers[state.index] = Number(event.target.value);
  updateProgress();
});
get('previous').addEventListener('click', () => {
  if (state.index === 0) return;
  state.index -= 1;
  renderQuestion();
});
get('next').addEventListener('click', () => {
  if (state.answers[state.index] === undefined) return;
  if (state.index === questions.length - 1) {
    renderResult();
    return;
  }
  state.index += 1;
  renderQuestion();
});
get('retake').addEventListener('click', () => {
  resetQuiz();
  showHome();
});

const preview = get('poster-preview');
let posterUrl;
get('save-poster').addEventListener('click', async () => {
  const button = get('save-poster');
  const status = get('save-status');
  const profile = state.profile;
  button.disabled = true;
  status.textContent = '正在生成分享卡…';
  try {
    const blob = await buildPoster(profile);
    if (state.view !== 'result' || state.profile !== profile) return;
    posterUrl = URL.createObjectURL(blob);
    get('preview-image').src = posterUrl;
    get('poster-download').href = posterUrl;
    get('poster-download').download = '脑洞星球-' + profile.name + '.png';
    preview.showModal();
    status.textContent = '';
  } catch {
    status.textContent = '暂时无法生成图片，你可以直接截取左侧或上方的人物卡。';
  } finally {
    button.disabled = false;
    if (preview.open) preview.querySelector('button').focus();
  }
});
preview.addEventListener('close', () => {
  URL.revokeObjectURL(posterUrl);
  get('preview-image').removeAttribute('src');
  get('poster-download').removeAttribute('href');
  get('save-poster').focus({ preventScroll: true });
});
