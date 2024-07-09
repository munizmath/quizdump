        document.addEventListener('DOMContentLoaded', function() {
            
            var attempts = {}; // Adicione esta linha no início do seu script   
            var currentQuestionIndex = 0;
            var quizData = []; // Este array será preenchido com os dados do quiz
            var selectedGroups = [];

            
            var countdownMinutes = 60;
            var countdownIntervalId = null;

            function startCountdown() {
                // Se um temporizador já estiver em execução, pare-o
                if (countdownIntervalId) {
                    clearInterval(countdownIntervalId);
                }

                var countdownElement = document.getElementById('countdown');
                var endTime = Date.now() + countdownMinutes * 60 * 1000;

                countdownIntervalId = setInterval(function() {
                    var timeRemaining = endTime - Date.now();
                    if (timeRemaining <= 0) {
                        clearInterval(countdownIntervalId);
                        timeRemaining = 0;
                    }

                    var minutes = Math.floor(timeRemaining / 1000 / 60);
                    var seconds = Math.floor((timeRemaining / 1000) % 60);
                    countdownElement.textContent = minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
                }, 1000);
            }

            document.getElementById('pause-button').addEventListener('click', function() {
                if (this.textContent === 'Pausar') {
                    clearInterval(countdownIntervalId);
                    this.textContent = 'Retomar';
                    this.style.backgroundColor = '#5b5c5e'; // Muda a cor do botão para cinza
                } else {
                    startCountdown();
                    this.textContent = 'Pausar';
                    this.style.backgroundColor = '#007BFF'; // Muda a cor do botão para azul
                }
            });
            
            document.getElementById('restart-button').addEventListener('click', function() {
                // Reinicie o quiz
                attempts = {};
                currentQuestionIndex = 0;

                // Reinicie o temporizador
                clearInterval(countdownIntervalId);

                // Carregue os dados dos grupos selecionados
                loadQuizData(selectedGroups);
                startCountdown();

                // Limpe selectedGroups e remova a classe 'selected' de todos os botões do grupo
                selectedGroups = [];
                for (var j = 0; j < groupButtons.length; j++) {
                    groupButtons[j].className = 'group-button';
                }
            });

            document.getElementById('finish-button').addEventListener('click', function() {
                // Finalize o quiz
                clearInterval(countdownIntervalId); // Pare o temporizador
                submitAnswers(); // Verifique todas as respostas
            });

            document.getElementById('home-button').addEventListener('click', function() {
                // Volte para a página inicial
                window.location.href = 'index.html'; // Substitua '/' pelo URL da sua página inicial
            });

            function loadQuizData(groups) {
                // Carregue os dados do quiz aqui (por exemplo, usando fetch() se os dados estiverem em um servidor)
                fetch('questions_cobit.json')
                    .then(response => response.json())
                    .then(data => {
                        // Divida as perguntas em grupos de 25
                        quizData = [];
                        for (var i = 0; i < groups.length; i++) {
                            var start = groups[i] * 25;
                            var end = start + 25;
                            quizData = quizData.concat(data.questions.slice(start, end));
                        }

                        showAllQuestions();
                        startCountdown(); // Mova a chamada para startCountdown() para aqui
                    });
            }

            function shuffleArray(array) { // Função para embaralhar as respostas
                for (var i = array.length - 1; i > 0; i--) {
                    var j = Math.floor(Math.random() * (i + 1));
                    var temp = array[i];
                    array[i] = array[j];
                    array[j] = temp;
                }
                return array;
            }
        
            function showAllQuestions() {
                var quizContainer = document.getElementById('quiz-container');

                // Limpe o conteúdo existente
                quizContainer.innerHTML = '';

                // Embaralhe as perguntas
                shuffleArray(quizData);

                // Mostre todas as perguntas e opções de resposta
                for (var questionIndex = 0; questionIndex < quizData.length; questionIndex++) {
                    var questionData = quizData[questionIndex];

                    var questionElement = document.createElement('div');
                    questionElement.innerHTML = '<h2>Questão ' + (questionIndex + 1) + ' - ' + questionData.question + '</h2>'; // Adicione o número da pergunta aqui

                    // Embaralhe as opções de resposta
                    var options = Object.keys(questionData.options);
                    shuffleArray(options);

                    for (var i = 0; i < options.length; i++) {
                        var option = options[i];
                        var id = 'question-' + questionIndex + '-option-' + option;
                        
                        // Adicione um ouvinte de evento 'change' a cada opção de resposta
                        var inputElement = document.createElement('input');
                        inputElement.type = questionData.correctAnswer.length > 1 ? 'checkbox' : 'radio'; // Use checkbox para perguntas de múltipla escolha
                        inputElement.id = id;
                        inputElement.name = 'question-' + questionIndex;
                        inputElement.value = option;
                        inputElement.addEventListener('change', function() {
                            checkAnswer(this);
                        });
                        questionElement.appendChild(inputElement);

                        var labelElement = document.createElement('label');
                        labelElement.htmlFor = id;
                        labelElement.textContent = questionData.options[option];
                        questionElement.appendChild(labelElement);
                    }

                    quizContainer.appendChild(questionElement);
                }
            }

            var correctAnswers = 0;
            var incorrectAnswers = 0;
            var attempts = {}; // Adicione esta linha no início do seu script

            function checkAnswer(answerElement) {
                var questionIndex = answerElement.name.split('-')[1];
                var selectedAnswer = answerElement.value;
                var label = document.querySelector('label[for="' + answerElement.id + '"]');

                // Verifique se a pergunta já foi respondida duas vezes
                if (attempts[questionIndex] && attempts[questionIndex] >= 2) {
                    alert('Você já respondeu a esta pergunta duas vezes.');
                    return;
                }

                // Incremente o contador de tentativas para esta pergunta
                if (!attempts[questionIndex]) {
                    attempts[questionIndex] = 1;
                } else {
                    attempts[questionIndex]++;
                }

                // Verifique se a resposta está correta
                var isCorrect = quizData[questionIndex].correctAnswer.includes(selectedAnswer);
                if (isCorrect) {
                    label.style.backgroundColor = 'green';
                    // Incremente o contador de respostas corretas apenas na primeira tentativa
                    if (attempts[questionIndex] === 1) {
                        correctAnswers++;
                    }
                } else {
                    label.style.backgroundColor = 'red';
                    // Incremente o contador de respostas incorretas apenas na primeira tentativa
                    if (attempts[questionIndex] === 1) {
                        incorrectAnswers++;
                    }
                }

                // Se a pergunta foi respondida duas vezes, marque todas as outras respostas
                if (attempts[questionIndex] >= 2) {
                    for (var option in quizData[questionIndex].options) {
                        var id = 'question-' + questionIndex + '-option-' + option;
                        var otherLabel = document.querySelector('label[for="' + id + '"]');
                        if (quizData[questionIndex].correctAnswer.includes(option)) {
                            otherLabel.style.backgroundColor = 'green';
                        } else if (!quizData[questionIndex].correctAnswer.includes(option)) {
                            otherLabel.style.backgroundColor = 'red';
                        }
                    }
                }

                // Calcule a porcentagem de respostas corretas e incorretas
                var totalQuestions = quizData.length;
                var correctPercentage = Math.round((correctAnswers / totalQuestions) * 100);
                var incorrectPercentage = Math.round((incorrectAnswers / totalQuestions) * 100);

                // Calcule o número de questões que restam para passar na prova
                var questionsToPass = Math.ceil(0.8 * totalQuestions); // 80% das questões totais
                var remainingQuestions = questionsToPass - correctAnswers;

                // Atualize o contador de respostas certas e erradas
                document.getElementById('correct-number').textContent = correctAnswers;
                document.getElementById('correct-percentage').textContent = correctPercentage + '%';
                document.getElementById('incorrect-number').textContent = incorrectAnswers;
                document.getElementById('incorrect-percentage').textContent = incorrectPercentage + '%';
                document.getElementById('remaining-questions').textContent = 'Restam ' + remainingQuestions + ' questões para passar na prova';
            }


            function submitAnswers() {
                var correctAnswers = 0;
                var incorrectAnswers = 0;

                for (var questionIndex = 0; questionIndex < quizData.length; questionIndex++) {
                    var selectedAnswerElement = document.querySelector('input[name="question-' + questionIndex + '"]:checked');
                    if (selectedAnswerElement) {
                        var selectedAnswer = selectedAnswerElement.value;
                        var label = document.querySelector('label[for="question-' + questionIndex + '-option-' + selectedAnswer + '"]');

                        if (selectedAnswer === quizData[questionIndex].correctAnswer) {
                            label.style.backgroundColor = 'green';
                            correctAnswers++;
                        } else {
                            label.style.backgroundColor = 'red';
                            incorrectAnswers++;
                        }
                    }
                }

                // Calcule a porcentagem de respostas corretas e incorretas
                var totalQuestions = quizData.length;
                var correctPercentage = Math.round((correctAnswers / totalQuestions) * 100);
                var incorrectPercentage = Math.round((incorrectAnswers / totalQuestions) * 100);

                document.getElementById('score').textContent = 'Certas: ' + correctAnswers + ' (' + correctPercentage + '%), Erradas: ' + incorrectAnswers + ' (' + incorrectPercentage + '%)';

                // Verifique se o usuário atingiu a pontuação mínima necessária
                if (correctPercentage < 80) {
                    alert('Você não atingiu a pontuação mínima necessária de 80%. Sua pontuação foi de ' + correctPercentage + '%.');
                }
            }
        
            window.onload = function() {
                document.getElementById('submit-button').addEventListener('click', submitAnswers);

                var allowedCombinations = [
                    [1, 2, 3], [1, 2, 4], [1, 2, 5], [1, 2, 6], [1, 3, 4], [2, 3, 4], [2, 5, 6], [1, 2, 3], [3, 4, 5], [3, 4, 6], [4, 5, 6], [1, 5, 6]
                ];

                // Adicione ouvintes de eventos aos botões do grupo
                var groupButtons = document.querySelectorAll('.group-button');
                for (var i = 0; i < groupButtons.length; i++) {
                    groupButtons[i].addEventListener('click', function() {
                        var group = Number(this.getAttribute('data-group'));

                        // Se o grupo já foi selecionado, remova-o de selectedGroups
                        var index = selectedGroups.indexOf(group);
                        if (index > -1) {
                            selectedGroups.splice(index, 1);
                            this.classList.remove('selected');
                        } else {
                            // Se já selecionou 3 grupos, não permita mais seleções
                            if (selectedGroups.length >= 3) {
                                alert("Você já selecionou 3 grupos.");
                                return;
                            }

                            // Adicione o grupo a selectedGroups
                            selectedGroups.push(group);
                            this.classList.add('selected');

                            // Se selecionou 3 grupos, verifique se a combinação está na lista de combinações permitidas
                            if (selectedGroups.length < 3 || allowedCombinations.some(function(combination) {
                                return JSON.stringify(combination.sort()) === JSON.stringify(selectedGroups.sort());
                            })) {
                                // Carregue os dados do grupo selecionado
                                loadQuizData(selectedGroups);

                                // Reinicie o temporizador
                                clearInterval(countdownIntervalId);
                                startCountdown();
                            } else {
                                alert('Esta combinação de grupos não é permitida.');
                                selectedGroups.pop();  // Remova o último grupo selecionado
                                this.classList.remove('selected');
                            }
                        }
                    });
                }

            }

        });
