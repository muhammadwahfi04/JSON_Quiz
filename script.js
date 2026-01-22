let quizData = null;
let currentQuestion = 0;
let score = 0;
let answers = [];
let shuffledQuestionOrder = null;
let isShuffled = false;
let savedQuizzes = [];
let currentQuizIndex = -1;

// Elemen DOM
const importBtn          = document.getElementById('import-btn');
const shuffleBtn         = document.getElementById('shuffle-questions-btn');
const fileInput          = document.getElementById('json-file-input');
const fileStatus         = document.getElementById('file-status');
const quizTitle          = document.getElementById('quiz-title');
const questionNumber     = document.getElementById('question-number');
const totalQuestions     = document.getElementById('total-questions');
const questionText       = document.getElementById('question-text');
const optionsForm        = document.getElementById('options-form');
const feedback           = document.getElementById('feedback');
const explanation        = document.getElementById('explanation');
const prevBtn            = document.getElementById('prev-btn');
const nextBtn            = document.getElementById('next-btn');
const helpBtn            = document.getElementById('help-btn');
const progressDiv        = document.getElementById('progress-bubbles');
const resultModal        = document.getElementById('result-modal');
const resultText         = document.getElementById('result-text');
const closeResult        = document.getElementById('close-result');
const storyBtn           = document.getElementById('story-btn');
const storyModal         = document.getElementById('story-modal');
const storyContent       = document.getElementById('story-content');
const closeStory         = document.getElementById('close-story');
const themeToggle        = document.getElementById('theme-toggle');
const toggleProgressBtn  = document.getElementById('toggle-progress');
const quizListDiv        = document.getElementById('quiz-list');
const body               = document.body;

// Inisialisasi modal
resultModal.classList.add('hidden');
storyModal.classList.add('hidden');

// Load saved quizzes dari localStorage saat halaman dibuka
function loadSavedQuizzes() {
    const saved = localStorage.getItem('savedQuizzes');
    if (saved) {
        savedQuizzes = JSON.parse(saved);
        renderQuizList();
        // Jika ada kuis tersimpan, load yang terakhir secara otomatis
        if (savedQuizzes.length > 0) {
            loadQuizFromSaved(savedQuizzes.length - 1);
        }
    } else {
        resetUI();
    }
}

// Render daftar kuis
function renderQuizList() {
    quizListDiv.innerHTML = '';
    if (savedQuizzes.length === 0) {
        quizListDiv.innerHTML = '<p style="text-align:center;opacity:0.7;">Belum ada kuis tersimpan</p>';
        return;
    }

    savedQuizzes.forEach((quiz, index) => {
        const item = document.createElement('div');
        item.className = 'quiz-list-item' + (currentQuizIndex === index ? ' active' : '');
        item.innerHTML = `
            <span>${quiz.name}</span>
            <button class="delete-btn" title="Hapus kuis" data-index="${index}">×</button>
        `;

        item.querySelector('span').addEventListener('click', () => {
            loadQuizFromSaved(index);
            document.querySelectorAll('.quiz-list-item').forEach(el => el.classList.remove('active'));
            item.classList.add('active');
        });

        item.querySelector('.delete-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm(`Hapus "${quiz.name}"?`)) {
                savedQuizzes.splice(index, 1);
                localStorage.setItem('savedQuizzes', JSON.stringify(savedQuizzes));
                renderQuizList();
                if (currentQuizIndex === index) {
                    resetUI();
                }
            }
        });

        quizListDiv.appendChild(item);
    });
}

// Load kuis dari saved
function loadQuizFromSaved(index) {
    const selected = savedQuizzes[index];
    quizData = selected.data;
    currentQuestion = 0;
    score = 0;
    answers = new Array(quizData.quizList.length).fill(null);
    isShuffled = false;
    shuffledQuestionOrder = null;
    currentQuizIndex = index;

    body.classList.remove('no-quiz');
    body.classList.add('has-quiz');
    fileStatus.textContent = `Dimuat: ${selected.name}`;
    shuffleBtn.classList.remove('hidden');
    initQuiz();
}

// Simpan kuis baru
function saveQuizToStorage(fileName, data) {
    const newQuiz = { name: fileName, data };
    const existingIndex = savedQuizzes.findIndex(q => q.name === fileName);
    if (existingIndex !== -1) {
        savedQuizzes[existingIndex] = newQuiz;
    } else {
        savedQuizzes.push(newQuiz);
    }
    localStorage.setItem('savedQuizzes', JSON.stringify(savedQuizzes));
    renderQuizList();
}

// Reset UI
function resetUI() {
    questionText.textContent = "Pilih kuis dari daftar di kiri atau import baru";
    optionsForm.innerHTML = '';
    feedback.classList.add('hidden');
    feedback.textContent = '';
    explanation.classList.add('hidden');
    explanation.innerHTML = '';
    storyBtn.classList.add('hidden');
    progressDiv.innerHTML = '';
    quizTitle.textContent = "Quiz Title";
    totalQuestions.textContent = "/ 0";
    questionNumber.textContent = "Question 1";
    resultModal.classList.add('hidden');
    storyModal.classList.add('hidden');
    shuffleBtn.classList.add('hidden');
    isShuffled = false;
    shuffledQuestionOrder = null;
    currentQuizIndex = -1;
    helpBtn.disabled = true;
}

// Toggle theme
themeToggle.addEventListener('click', () => {
    body.classList.toggle('dark-mode');
    body.classList.toggle('light-mode');
    themeToggle.textContent = body.classList.contains('dark-mode') ? '☀️' : '🌙';
});

// Import JSON
importBtn.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;

    fileStatus.textContent = `Memuat ${file.name}...`;
    resetUI();

    const reader = new FileReader();
    reader.onload = event => {
        try {
            const data = JSON.parse(event.target.result);
            if (!data.quizList || !Array.isArray(data.quizList)) {
                throw new Error("Format tidak valid: harus punya 'quizList'");
            }

            quizData = data;

            fileStatus.textContent = `Berhasil: ${file.name} (${quizData.quizList.length} soal)`;
            currentQuestion = 0;
            score = 0;
            answers = new Array(quizData.quizList.length).fill(null);
            shuffleBtn.classList.remove('hidden');

            // Simpan permanen
            saveQuizToStorage(file.name, data);

            body.classList.remove('no-quiz');
            body.classList.add('has-quiz');
            initQuiz();
        } catch (err) {
            fileStatus.textContent = "Gagal memuat: format JSON salah";
            alert("Error: " + err.message);
        }
    };
    reader.readAsText(file);
});

// Tombol Acak Soal
shuffleBtn.addEventListener('click', () => {
    if (!quizData) return;

    shuffledQuestionOrder = [...Array(quizData.quizList.length).keys()];
    shuffledQuestionOrder.sort(() => Math.random() - 0.5);
    isShuffled = true;
    currentQuestion = 0;
    loadQuestion();
    updateProgress();
});

// initQuiz
function initQuiz() {
    quizTitle.textContent = "Vocabulary dari Story";
    storyContent.innerHTML = quizData.story.replace(/\n/g, '<br>');
    totalQuestions.textContent = `/ ${quizData.quizList.length}`;
    storyBtn.classList.remove('hidden');
    helpBtn.disabled = false;

    progressDiv.innerHTML = '';
    for (let i = 0; i < quizData.quizList.length; i++) {
        const span = document.createElement('span');
        span.textContent = i + 1;
        span.addEventListener('click', () => {
            currentQuestion = i;
            loadQuestion();
        });
        progressDiv.appendChild(span);
    }

    loadQuestion();
}

function getCurrentQuestionIndex() {
    return isShuffled ? shuffledQuestionOrder[currentQuestion] : currentQuestion;
}

function loadQuestion() {
    if (!quizData) return;

    const realIndex = getCurrentQuestionIndex();
    const q = quizData.quizList[realIndex];

    questionNumber.textContent = `Question ${currentQuestion + 1}`;
    questionText.textContent = q.question;

    optionsForm.innerHTML = '';
    optionsForm.classList.toggle('locked', answers[realIndex] !== null);

    feedback.textContent = '';
    feedback.classList.add('hidden');
    explanation.innerHTML = '';
    explanation.classList.add('hidden');

    let shuffledOptions = [...q.options];
    shuffledOptions = shuffledOptions.map((opt, idx) => ({ text: opt, originalIndex: idx }));
    shuffledOptions.sort(() => Math.random() - 0.5);

    shuffledOptions.forEach(item => {
        const label = document.createElement('label');
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'answer';
        radio.value = item.originalIndex;
        radio.checked = answers[realIndex] === item.originalIndex;
        radio.disabled = answers[realIndex] !== null;

        radio.addEventListener('change', () => {
            if (answers[realIndex] !== null) return;

            answers[realIndex] = item.originalIndex;
            const isCorrect = item.originalIndex === q.correctIndex;
            if (isCorrect) score++;

            feedback.textContent = isCorrect ? 'Benar!' : 'Salah!';
            feedback.classList.remove('hidden');
            feedback.classList.toggle('correct', isCorrect);
            feedback.classList.toggle('incorrect', !isCorrect);

            optionsForm.classList.add('locked');
            Array.from(optionsForm.querySelectorAll('input')).forEach(r => r.disabled = true);

            updateProgress();
            showExplanation(q.answer);
        });

        label.appendChild(radio);
        label.appendChild(document.createTextNode(` ${item.text}`));
        optionsForm.appendChild(label);
    });

    if (answers[realIndex] !== null) {
        const isCorrect = answers[realIndex] === q.correctIndex;
        feedback.textContent = isCorrect ? 'Benar!' : 'Salah!';
        feedback.classList.remove('hidden');
        feedback.classList.toggle('correct', isCorrect);
        feedback.classList.toggle('incorrect', !isCorrect);
        showExplanation(q.answer);
    }

    updateProgress();
    updateButtons();
}

function showExplanation(ansText) {
    explanation.innerHTML = ansText.replace(/\n/g, '<br>');
    explanation.classList.remove('hidden');
}

function updateButtons() {
    prevBtn.disabled = currentQuestion === 0;
    nextBtn.textContent = currentQuestion === (shuffledQuestionOrder?.length || quizData.quizList.length) - 1 ? 'Selesai' : 'Next';
    nextBtn.disabled = false;
}

function updateProgress() {
    progressDiv.querySelectorAll('span').forEach((span, i) => {
        span.classList.toggle('current', i === currentQuestion);
        const realIdx = isShuffled ? shuffledQuestionOrder[i] : i;
        span.classList.toggle('answered', answers[realIdx] !== null);
    });
}

// Navigasi
nextBtn.addEventListener('click', () => {
    if (!quizData) return;

    const max = isShuffled ? shuffledQuestionOrder.length : quizData.quizList.length;
    if (currentQuestion < max - 1) {
        currentQuestion++;
        loadQuestion();
    } else {
        const total = quizData.quizList.length;
        const salah = total - score;
        resultText.innerHTML = `
            Benar: <strong>${score}</strong><br>
            Salah: <strong>${salah}</strong><br>
            Total: <strong>${total}</strong><br><br>
            ${score === total ? "Sempurna! 🌟" : "Bagus! Lanjut lagi ya 💪"}
        `;
        resultModal.classList.remove('hidden');
    }
});

prevBtn.addEventListener('click', () => {
    if (currentQuestion > 0) {
        currentQuestion--;
        loadQuestion();
    }
});

helpBtn.addEventListener('click', () => {
    if (quizData) {
        const realIndex = getCurrentQuestionIndex();
        showExplanation(quizData.quizList[realIndex].answer);
    }
});

// Modal Story
storyBtn.addEventListener('click', () => storyModal.classList.remove('hidden'));
closeStory.addEventListener('click', () => storyModal.classList.add('hidden'));
storyModal.addEventListener('click', e => { if (e.target === storyModal) storyModal.classList.add('hidden'); });

// Modal Hasil
closeResult.addEventListener('click', () => resultModal.classList.add('hidden'));
resultModal.addEventListener('click', e => { if (e.target === resultModal) resultModal.classList.add('hidden'); });

// Toggle progress
let isProgressVisible = true;
toggleProgressBtn.addEventListener('click', () => {
    isProgressVisible = !isProgressVisible;
    progressDiv.style.display = isProgressVisible ? 'flex' : 'none';
    toggleProgressBtn.textContent = isProgressVisible ? '−' : '+';
    toggleProgressBtn.title = isProgressVisible ? 'Sembunyikan daftar soal' : 'Tampilkan daftar soal';
});

// Load daftar kuis tersimpan saat halaman dibuka
loadSavedQuizzes();