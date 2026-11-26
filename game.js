'use strict';

(() => {
  const questions = Array.isArray(window.HISTORY_GAME_QUESTIONS) ? window.HISTORY_GAME_QUESTIONS : [];
  const $ = (id) => document.getElementById(id);
  const TOTAL_QUESTIONS = 10;
  const ROUND_SECONDS = 18;
  const STORAGE_KEY = 'historyGuessGame.v1';

  const state = {
    mode: 'daily',
    round: [],
    index: 0,
    score: 0,
    correct: 0,
    timeLeft: ROUND_SECONDS,
    answered: false,
    hintUsed: false,
    timerId: null
  };

  const defaultStats = () => ({
    bestScore: 0,
    streak: 0,
    lastDailyDate: '',
    dailyBest: {},
    plays: 0
  });

  function loadStats() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return {
        bestScore: Number(saved.bestScore) || 0,
        streak: Number(saved.streak) || 0,
        lastDailyDate: saved.lastDailyDate || '',
        dailyBest: saved.dailyBest && typeof saved.dailyBest === 'object' ? saved.dailyBest : {},
        plays: Number(saved.plays) || 0
      };
    } catch {
      return defaultStats();
    }
  }

  let stats = loadStats();

  function saveStats() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    } catch {
      // Private browsing or storage restrictions should not prevent a game from finishing.
    }
  }

  function dateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
  }

  function todayKey() {
    return dateKey(new Date());
  }

  function yesterdayKey() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return dateKey(yesterday);
  }

  function seededRandom(seedText) {
    let seed = 2166136261;
    for (let i = 0; i < seedText.length; i += 1) {
      seed = Math.imul(seed ^ seedText.charCodeAt(i), 16777619);
    }
    return function random() {
      seed += 0x6D2B79F5;
      let value = seed;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }

  function shuffle(items, random) {
    const result = items.slice();
    for (let i = result.length - 1; i > 0; i -= 1) {
      const j = Math.floor(random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  function makeRound(mode) {
    const random = mode === 'daily' ? seededRandom(todayKey()) : Math.random;
    return shuffle(questions, random).slice(0, TOTAL_QUESTIONS).map((question) => ({
      ...question,
      choices: shuffle(question.choices, random)
    }));
  }

  function showScreen(name) {
    ['home', 'play', 'result'].forEach((screen) => {
      $('screen-' + screen).hidden = screen !== name;
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderHome() {
    $('best-score').textContent = String(stats.bestScore);
    const dailyBest = Number(stats.dailyBest[todayKey()]) || 0;
    $('daily-score').textContent = dailyBest ? dailyBest + ' 分' : '未挑战';
    $('streak-count').textContent = stats.streak + ' 天';
  }

  function updateTimer() {
    $('timer-value').textContent = String(state.timeLeft);
    $('timer-value').classList.toggle('urgent', state.timeLeft <= 5);
    $('progress-fill').style.width = (state.index / TOTAL_QUESTIONS * 100) + '%';
  }

  function stopTimer() {
    if (state.timerId !== null) {
      window.clearInterval(state.timerId);
      state.timerId = null;
    }
  }

  function startTimer() {
    stopTimer();
    state.timerId = window.setInterval(() => {
      state.timeLeft -= 1;
      updateTimer();
      if (state.timeLeft <= 0) {
        stopTimer();
        handleAnswer(null);
      }
    }, 1000);
  }

  function renderQuestion() {
    const question = state.round[state.index];
    state.timeLeft = ROUND_SECONDS;
    state.answered = false;
    state.hintUsed = false;

    $('round-label').textContent = (state.index + 1) + ' / ' + TOTAL_QUESTIONS;
    $('question-number').textContent = 'NO. ' + String(state.index + 1).padStart(2, '0');
    $('question-title').textContent = '根据线索，猜猜这位历史人物是谁？';
    $('clue-text').textContent = question.clue;
    $('score-value').textContent = String(state.score);
    $('hint-text').textContent = question.hint;
    $('hint-text').hidden = true;
    $('hint-button').disabled = false;
    $('feedback-panel').hidden = true;
    $('next-button').hidden = true;
    $('next-button').textContent = state.index === TOTAL_QUESTIONS - 1 ? '查看本局成绩' : '下一题';

    const letters = ['A', 'B', 'C', 'D'];
    $('answer-options').replaceChildren(...question.choices.map((choice, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'answer-option';
      button.dataset.answer = choice;

      const letter = document.createElement('span');
      letter.className = 'answer-letter';
      letter.textContent = letters[index];

      const label = document.createElement('span');
      label.textContent = choice;

      button.append(letter, label);
      button.addEventListener('click', () => handleAnswer(choice));
      return button;
    }));

    updateTimer();
    startTimer();
  }

  function handleAnswer(selected) {
    if (state.answered) return;
    state.answered = true;
    stopTimer();

    const question = state.round[state.index];
    const isCorrect = selected === question.answer;
    if (isCorrect) {
      state.correct += 1;
      state.score += 100 + state.timeLeft * 2;
    }

    $('score-value').textContent = String(state.score);
    $('answer-options').querySelectorAll('button').forEach((button) => {
      button.disabled = true;
      if (button.dataset.answer === question.answer) button.classList.add('correct');
      else if (button.dataset.answer === selected) button.classList.add('incorrect');
    });

    if (selected === null) {
      $('feedback-title').textContent = '时间到！正确答案是 ' + question.answer;
    } else if (isCorrect) {
      $('feedback-title').textContent = '答对了！ +' + (100 + state.timeLeft * 2) + ' 分';
    } else {
      $('feedback-title').textContent = '再记住这个人物：' + question.answer;
    }
    $('feedback-detail').textContent = question.explanation;
    $('feedback-panel').hidden = false;
    $('next-button').hidden = false;
    $('progress-fill').style.width = ((state.index + 1) / TOTAL_QUESTIONS * 100) + '%';
  }

  function useHint() {
    if (state.answered || state.hintUsed) return;
    state.hintUsed = true;
    state.score = Math.max(0, state.score - 20);
    $('score-value').textContent = String(state.score);
    $('hint-text').hidden = false;
    $('hint-button').disabled = true;
  }

  function finishGame() {
    stopTimer();
    const today = todayKey();
    stats.plays += 1;
    stats.bestScore = Math.max(stats.bestScore, state.score);

    if (state.mode === 'daily') {
      const previousDate = stats.lastDailyDate;
      if (previousDate !== today) {
        stats.streak = previousDate === yesterdayKey() ? stats.streak + 1 : 1;
        stats.lastDailyDate = today;
      }
      stats.dailyBest[today] = Math.max(Number(stats.dailyBest[today]) || 0, state.score);
    }

    saveStats();
    renderResult();
    renderHome();
    showScreen('result');
  }

  function renderResult() {
    const accuracy = Math.round(state.correct / TOTAL_QUESTIONS * 100);
    let rank = '再读一卷';
    let title = '每一次挑战，都是新的开始。';
    if (state.score >= 1200) {
      rank = '史学通鉴';
      title = '这份历史直觉，已经相当厉害。';
    } else if (state.score >= 1000) {
      rank = '人物识途';
      title = '你已经能从细节里认出人物。';
    } else if (state.score >= 800) {
      rank = '线索猎手';
      title = '抓住关键线索，你就能更进一步。';
    } else if (state.score >= 600) {
      rank = '初入史海';
      title = '再积累一点线索，下次会更准。';
    }

    $('result-title').textContent = title;
    $('result-subtitle').textContent = state.mode === 'daily' ? '今日挑战已完成，明天再来刷新纪录。' : '自由练习完成，试试下一轮能否更快。';
    $('final-score').textContent = String(state.score);
    $('rank-label').textContent = rank;
    $('correct-count').textContent = state.correct + ' / ' + TOTAL_QUESTIONS;
    $('accuracy-rate').textContent = accuracy + '%';
    $('best-result').textContent = String(stats.bestScore);
    $('share-status').textContent = '';
  }

  function startGame(mode) {
    stopTimer();
    if (questions.length < TOTAL_QUESTIONS) {
      $('home-title').textContent = '题库正在准备中';
      return;
    }
    state.mode = mode;
    state.round = makeRound(mode);
    state.index = 0;
    state.score = 0;
    state.correct = 0;
    showScreen('play');
    $('mode-label').textContent = mode === 'daily' ? "TODAY'S CHALLENGE" : 'FREE PRACTICE';
    renderQuestion();
  }

  async function shareResult() {
    const message = '我在「历史人物快猜」拿到 ' + state.score + ' 分，答对 ' + state.correct + ' / ' + TOTAL_QUESTIONS + ' 题！你来挑战一下？';
    const shareData = { title: '历史人物快猜', text: message, url: window.location.href };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        $('share-status').textContent = '分享面板已打开。';
        return;
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(message + ' ' + window.location.href);
        $('share-status').textContent = '成绩文案已复制，可以发给朋友了。';
        return;
      }
      const field = document.createElement('textarea');
      field.value = message + ' ' + window.location.href;
      document.body.append(field);
      field.select();
      const copied = document.execCommand('copy');
      field.remove();
      $('share-status').textContent = copied ? '成绩文案已复制，可以发给朋友了。' : '复制暂不可用，请截图分享成绩。';
    } catch (error) {
      if (error && error.name === 'AbortError') return;
      $('share-status').textContent = '暂时无法分享，请截图保存成绩。';
    }
  }

  $('start-daily').addEventListener('click', () => startGame('daily'));
  $('start-practice').addEventListener('click', () => startGame('practice'));
  $('hint-button').addEventListener('click', useHint);
  $('next-button').addEventListener('click', () => {
    if (state.index === TOTAL_QUESTIONS - 1) finishGame();
    else {
      state.index += 1;
      renderQuestion();
    }
  });
  $('quit-button').addEventListener('click', () => {
    stopTimer();
    renderHome();
    showScreen('home');
  });
  $('replay-button').addEventListener('click', () => startGame(state.mode));
  $('home-button').addEventListener('click', () => {
    renderHome();
    showScreen('home');
  });
  $('share-button').addEventListener('click', shareResult);
  window.addEventListener('pagehide', stopTimer);

  renderHome();
})();