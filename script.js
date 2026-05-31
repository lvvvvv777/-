let state = { questions: [], currentIdx: 0, score: 0 };

const playBeep = (f, d) => {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(f, ctx.currentTime);
    g.gain.setValueAtTime(0.1, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + d);
    osc.connect(g); g.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + d);
};


const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth; canvas.height = window.innerHeight;
const drops = Array(Math.floor(canvas.width / 16)).fill(1);
function matrix() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0f0';
    drops.forEach((y, i) => {
        ctx.fillText("01"[Math.floor(Math.random()*2)], i*16, y*16);
        if (y*16 > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
    });
}
setInterval(matrix, 50);

document.getElementById('file-input').onchange = (e) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
        state.questions = JSON.parse(ev.target.result);
        document.getElementById('setup-screen').classList.add('hidden');
        document.getElementById('stats').classList.remove('hidden');
        document.getElementById('quiz-screen').classList.remove('hidden');
        render();
    };
    reader.readAsText(e.target.files[0]);
};

function render() {
    const q = state.questions[state.currentIdx];
    document.getElementById('question-text').textContent = q.question;
    document.getElementById('current-q').textContent = state.currentIdx + 1;
    const grid = document.getElementById('options-grid');
    grid.innerHTML = '';
    q.options.forEach((opt, i) => {
        const b = document.createElement('button');
        b.className = 'opt-btn'; b.textContent = opt;
        b.onclick = () => {
            playBeep(800, 0.05);
            grid.querySelectorAll('button').forEach(btn => btn.disabled = true);
            if (i === q.correctAnswer) { b.classList.add('correct'); state.score++; }
            else { b.classList.add('wrong'); grid.querySelectorAll('button')[q.correctAnswer].classList.add('correct'); }
            document.getElementById('score').textContent = state.score;
            document.getElementById('next-btn').classList.remove('hidden');
        };
        grid.appendChild(b);
    });
}

document.getElementById('next-btn').onclick = () => {
    playBeep(400, 0.1);
    state.currentIdx++;
    if (state.currentIdx < state.questions.length) {
        render(); document.getElementById('next-btn').classList.add('hidden');
    } else {
        document.getElementById('quiz-screen').classList.add('hidden');
        document.getElementById('result-screen').classList.remove('hidden');
        document.getElementById('final-stat').textContent = `TOTAL_SCORE: ${state.score}/${state.questions.length}`;
        showTop();
    }
};

document.getElementById('save-score-btn').onclick = () => {
    const name = document.getElementById('player-name').value || "ANON";
    const data = JSON.parse(localStorage.getItem('scores') || '[]');
    data.push({ name, score: state.score });
    localStorage.setItem('scores', JSON.stringify(data));
    document.getElementById('save-zone').classList.add('hidden');
    showTop();
};

function showTop() {
    const data = JSON.parse(localStorage.getItem('scores') || '[]');
    document.getElementById('leaderboard').innerHTML = data.sort((a,b)=>b.score-a.score).slice(0,5).map(i => `<li>${i.name} <span>${i.score}</span></li>`).join('');
}

document.getElementById('toggle-admin').onclick = () => document.getElementById('admin-panel').classList.toggle('hidden');
document.getElementById('add-q-form').onsubmit = (e) => {
    e.preventDefault();
    state.questions.push({
        question: document.getElementById('new-q-text').value,
        options: Array.from(document.querySelectorAll('.opt-in')).map(i => i.value),
        correctAnswer: parseInt(document.getElementById('correct-select').value)
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(state.questions, null, 2)], {type:'application/json'}));
    a.download = 'questions.json'; a.click();
};
