document.addEventListener('DOMContentLoaded', function () {
    const quizContainer = document.getElementById('quiz-container');
    const correctCounter = document.getElementById('correct-counter');
    const incorrectCounter = document.getElementById('incorrect-counter');
    const statusMessage = document.getElementById('status-message');
    const restartButton = document.getElementById('restart-button');
    const timerDisplay = document.getElementById('timer');
    const pauseButton = document.getElementById('pause-button');

    let correctCount = 0;
    let incorrectCount = 0;
    let allQuestions = [];
    let currentQuestions = [];
    let passingPercentage = 80;
    let selectedParts = [];
    let remainingTime = 0; // Será ajustado para 30 minutos ao selecionar 25 questões
    let timerInterval = null;
    let isPaused = false;
    let quizStarted = false;

    // Carregar perguntas do arquivo JSON
    fetch('questions.json')
        .then(response => response.json())
        .then(data => {
            allQuestions = data.questions;
            updateStatusMessage();
        });

    // Função para embaralhar um array (usada para perguntas e respostas)
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    function buildQuiz(questions) {
        if (questions.length === 0) {
            quizContainer.innerHTML = '';
            return;
        }

        correctCount = 0;
        incorrectCount = 0;
        correctCounter.textContent = correctCount;
        incorrectCounter.textContent = incorrectCount;

        const shuffledQuestions = shuffleArray([...questions]);

        const output = shuffledQuestions.map((currentQuestion, questionNumber) => {
            const inputType = Array.isArray(currentQuestion.correctAnswer) ? "checkbox" : "radio";
            const shuffledOptions = shuffleArray(Object.keys(currentQuestion.options));

            const answers = shuffledOptions.map(
                letter => `
                    <label class="answer">
                        <input type="${inputType}" name="question${questionNumber}" value="${letter}">
                        ${currentQuestion.options[letter]}
                    </label>`
            ).join('');

            return `
                <div class="question">
                    <h3>${questionNumber + 1}. ${currentQuestion.question}</h3>
                    <div class="answers">${answers}</div>
                    <p class="explanation" style="display: none; color: #006400; font-weight: bold;">${currentQuestion.explanation}</p>
                </div>`;
        });

        quizContainer.innerHTML = output.join('');
        quizStarted = true;

        shuffledQuestions.forEach((currentQuestion, questionNumber) => {
            const answerContainer = quizContainer.querySelector(`.question:nth-child(${questionNumber + 1}) .answers`);
            const explanationElement = quizContainer.querySelector(`.question:nth-child(${questionNumber + 1}) .explanation`);
            if (!answerContainer) return;

            let maxAttempts = Array.isArray(currentQuestion.correctAnswer) ? 2 : 1;
            let attempts = 0;
            let selectedAnswers = new Set();
            let answeredCorrectly = false;

            const inputs = answerContainer.querySelectorAll(`input[type="${Array.isArray(currentQuestion.correctAnswer) ? "checkbox" : "radio"}"]`);
            inputs.forEach(input => {
                input.addEventListener('change', function (event) {
                    if (answeredCorrectly || attempts >= maxAttempts) return;

                    const selectedOption = event.target.value;
                    const selectedLabel = event.target.parentElement;

                    if (Array.isArray(currentQuestion.correctAnswer)) {
                        if (event.target.checked) {
                            selectedAnswers.add(selectedOption);
                        } else {
                            selectedAnswers.delete(selectedOption);
                        }

                        if (selectedAnswers.size === 2) {
                            attempts++;
                            const selectedArray = Array.from(selectedAnswers);
                            if (selectedArray.every(ans => currentQuestion.correctAnswer.includes(ans))) {
                                correctCount++;
                                correctCounter.textContent = correctCount;
                                selectedArray.forEach(ans => {
                                    const label = answerContainer.querySelector(`input[value="${ans}"]`).parentElement;
                                    label.style.backgroundColor = 'green';
                                });
                                answeredCorrectly = true;
                                explanationElement.style.display = 'block';
                            } else {
                                selectedArray.forEach(ans => {
                                    const label = answerContainer.querySelector(`input[value="${ans}"]`).parentElement;
                                    label.style.backgroundColor = 'red';
                                });
                                incorrectCount++;
                                incorrectCounter.textContent = incorrectCount;
                                inputs.forEach(input => input.disabled = true);
                                explanationElement.style.display = 'block';

                                currentQuestion.correctAnswer.forEach(correctOption => {
                                    const correctLabel = answerContainer.querySelector(`input[value="${correctOption}"]`)?.parentElement;
                                    if (correctLabel) correctLabel.style.backgroundColor = 'green';
                                });
                            }
                        }
                    } else {
                        attempts++;
                        if (selectedOption === currentQuestion.correctAnswer) {
                            correctCount++;
                            correctCounter.textContent = correctCount;
                            selectedLabel.style.backgroundColor = 'green';
                            answeredCorrectly = true;
                            inputs.forEach(input => input.disabled = true);
                            explanationElement.style.display = 'block';
                        } else {
                            selectedLabel.style.backgroundColor = 'red';
                            incorrectCount++;
                            incorrectCounter.textContent = incorrectCount;
                            inputs.forEach(input => input.disabled = true);
                            explanationElement.style.display = 'block';

                            const correctLabel = answerContainer.querySelector(`input[value="${currentQuestion.correctAnswer}"]`)?.parentElement;
                            if (correctLabel) correctLabel.style.backgroundColor = 'green';
                        }
                    }
                    updateStatusMessage();
                });
            });
        });
    }

    function updateStatusMessage() {
        if (!quizStarted) return;

        const requiredCorrectAnswers = Math.ceil((passingPercentage / 100) * currentQuestions.length);
        const remainingCorrectAnswers = requiredCorrectAnswers - correctCount;

        if (remainingCorrectAnswers > 0) {
            if (correctCount + incorrectCount === currentQuestions.length) {
                statusMessage.textContent = "Você já respondeu todas as perguntas. Por favor, reinicie o quiz.";
            } else {
                statusMessage.textContent = `Acerte ${remainingCorrectAnswers} questões e atinja ${passingPercentage}% de acerto.`;
            }
        } else {
            statusMessage.textContent = `Parabéns! Você atingiu ${passingPercentage}% de acerto.`;
        }
    }

    function selectPart(partNumber) {
        if (selectedParts.length >= 3) {
            alert("Você já selecionou 3 partes.");
            return;
        }

        selectedParts.push(partNumber);

        const allowedCombinations = ["1,2,3", "1,2,4", "1,2,5", "1,2,6", "1,3,4", "2,3,4", "2,5,6", "3,4,5", "3,4,6", "4,5,6", "1,5,6"];
        const tempParts = [...selectedParts].sort().join(',');

        if (!allowedCombinations.includes(tempParts) && selectedParts.length === 3) {
            alert("Esta combinação de partes não é permitida.");
            selectedParts.pop();
            return;
        }

        // Ajustar o tempo para 30 minutos (1800 segundos) ao iniciar
        remainingTime = 30 * 60;
        if (!timerInterval) {
            timerInterval = setInterval(updateTimer, 1000);
        }

        updateQuiz();
    }

    function updateTimer() {
        if (isPaused) return;

        const minutes = Math.floor(remainingTime / 60);
        const seconds = remainingTime % 60;
        timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        if (remainingTime <= 0) {
            clearInterval(timerInterval);
            alert("O tempo acabou!");
        } else {
            remainingTime--;
        }
    }

    function pauseResumeTimer() {
        isPaused = !isPaused;
        pauseButton.textContent = isPaused ? 'Retomar' : 'Pausar';
    }

    function updateQuiz() {
        currentQuestions = selectedParts.flatMap(partNumber => {
            const start = (partNumber - 1) * 25;
            return allQuestions.slice(start, start + 25);
        });
        
        buildQuiz(currentQuestions);
        updateStatusMessage();
    }

    function selectAllParts() {
        passingPercentage = 85;
        currentQuestions = shuffleArray([...allQuestions]);
        buildQuiz(currentQuestions);
        updateStatusMessage();
    }

    restartButton.addEventListener('click', function () {
        resetParts();
    });

    function resetParts() {
        selectedParts = [];
        currentQuestions = [];
        correctCount = 0;
        incorrectCount = 0;
        correctCounter.textContent = correctCount;
        incorrectCounter.textContent = incorrectCount;
        passingPercentage = 80;

        remainingTime = 0;
        clearInterval(timerInterval);
        timerInterval = null;
        timerDisplay.textContent = "00:00";
        quizStarted = false;

        buildQuiz(currentQuestions);
        updateStatusMessage();
    }

    pauseButton.addEventListener('click', pauseResumeTimer);

    window.selectPart = selectPart;
    window.selectAllParts = selectAllParts;
    window.resetParts = resetParts;
});
