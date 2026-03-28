document.addEventListener('DOMContentLoaded', () => {

    // Helper — formats response and normalises LaTeX delimiters
    function formatResponse(text) {
        return text
            // Convert $$ display math first (before single $)
            .replace(/\$\$([\s\S]*?)\$\$/g, '\\[$1\\]')
            // Convert single $ inline math
            .replace(/\$((?:[^$\\]|\\.)+?)\$/g, '\\($1\\)')
            // Markdown headings
            .replace(/### (.*?)(\n|$)/g, '<h3>$1</h3>')
            .replace(/## (.*?)(\n|$)/g, '<h2>$1</h2>')
            .replace(/# (.*?)(\n|$)/g, '<h1>$1</h1>')
            // Bold and italic
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            // Newlines
            .replace(/\n/g, '<br>');
    }

    // Helper — renders MathJax on a specific element
    function renderMath(element) {
        if (window.MathJax && MathJax.typesetPromise) {
            MathJax.typesetPromise([element]).catch(err => console.error('MathJax error:', err));
        }
    }

    // Helper — evaluates expression using math.js
    function evaluateExpression(expression, x) {
        try {
            let expr = expression
                .replace(/[Mm]ath\./g, '')
                .replace(/\*\*/g, '^');

            if (window.math) {
                const result = math.evaluate(expr, { x: x });
                return (isFinite(result) && !isNaN(result)) ? result : null;
            }
            return null;
        } catch (err) {
            return null;
        }
    }

    // Helper — generates Plotly x/y values
    function generatePlotData(expression, xMin, xMax) {
        const xValues = [];
        const yValues = [];
        const steps = 500;
        const step = (xMax - xMin) / steps;

        for (let i = 0; i <= steps; i++) {
            const x = xMin + i * step;
            const y = evaluateExpression(expression, x);
            xValues.push(parseFloat(x.toFixed(6)));
            yValues.push(y !== null ? parseFloat(y.toFixed(6)) : null);
        }

        return { xValues, yValues };
    }

    // ── GRAPHS / PLOTLY ──
    const plotBtn = document.getElementById('plotBtn');
    if (plotBtn) {
        plotBtn.addEventListener('click', async () => {
            const equation = document.getElementById('equation').value;
            const graphTypeEl = document.querySelector('input[name="graph_type"]:checked');
            const graphType = graphTypeEl ? graphTypeEl.value : '2d';
            const plotlyDiv = document.getElementById('plotly-graph');
            const graphResponse = document.getElementById('graph-response');

            if (!equation.trim()) {
                graphResponse.innerHTML = '<p class="error">Please enter an equation.</p>';
                return;
            }

            graphResponse.innerHTML = '<p class="loading">Analyzing and plotting... please wait ⏳</p>';
            plotlyDiv.innerHTML = '';
            plotBtn.disabled = true;

            try {
                const formData = new FormData();
                formData.append('equation', equation);
                formData.append('graph_type', graphType);

                const res = await fetch('/plot', {
                    method: 'POST',
                    body: formData
                });
                const data = await res.json();

                if (data.status === 'success') {
                    const { expression, x_min, x_max, title, explanation } = data.plot;
                    const { xValues, yValues } = generatePlotData(expression, x_min, x_max);

                    const trace = {
                        x: xValues,
                        y: yValues,
                        type: 'scatter',
                        mode: 'lines',
                        name: title,
                        line: { color: '#38d9f5', width: 2.5 },
                        connectgaps: false
                    };

                    const isMobile = window.innerWidth <= 768;

                    const layout = {
                        height: isMobile ? 300 : 450,
                        title: { text: title, font: { color: '#e8eaf6', size: isMobile ? 12 : 16 } },
                        paper_bgcolor: '#131629',
                        plot_bgcolor: '#0d0f1a',
                        font: { color: '#8892b0', size: isMobile ? 10 : 12 },
                        xaxis: {
                            title: 'x',
                            gridcolor: 'rgba(56, 217, 245, 0.1)',
                            zerolinecolor: 'rgba(56, 217, 245, 0.3)',
                            tickfont: { color: '#8892b0', size: isMobile ? 9 : 11 }
                        },
                        yaxis: {
                            title: 'y',
                            gridcolor: 'rgba(56, 217, 245, 0.1)',
                            zerolinecolor: 'rgba(56, 217, 245, 0.3)',
                            tickfont: { color: '#8892b0', size: isMobile ? 9 : 11 }
                        },
                        margin: isMobile
                            ? { t: 40, l: 45, r: 10, b: 45 }
                            : { t: 50, l: 60, r: 30, b: 60 }
                    };

                    const config = {
                        responsive: true,
                        displayModeBar: true,
                        modeBarButtonsToRemove: ['lasso2d', 'select2d'],
                        toImageButtonOptions: { format: 'png', filename: 'calculo_graph' }
                    };

                    Plotly.newPlot('plotly-graph', [trace], layout, config);

                    graphResponse.innerHTML = `<div class="answer">${formatResponse(explanation)}</div>`;
                    renderMath(graphResponse);

                } else {
                    graphResponse.innerHTML = `<p class="error">Error: ${data.error}</p>`;
                    plotlyDiv.innerHTML = '';
                }
            } catch (err) {
                graphResponse.innerHTML = `<p class="error">Something went wrong: ${err.message}</p>`;
            } finally {
                plotBtn.disabled = false;
            }
        });
    }

    // ── SOLVER ──
    const solveBtn = document.getElementById('solveBtn');
    if (solveBtn) {
        solveBtn.addEventListener('click', async () => {
            const userInput = document.getElementById('user_input').value;
            const responseTypeEl = document.querySelector('input[name="response_type"]:checked');
            const responseType = responseTypeEl ? responseTypeEl.value : 'explain';
            const fileInput = document.getElementById('fileupload');
            const cameraInput = document.getElementById('cameracapture');
            const responseDiv = document.getElementById('response');

            if (!userInput.trim() && (!fileInput || !fileInput.files[0]) && (!cameraInput || !cameraInput.files[0])) {
                responseDiv.innerHTML = '<p class="error">Please enter a question or upload a file.</p>';
                return;
            }

            const formData = new FormData();
            formData.append('user_input', userInput);
            formData.append('response_type', responseType);

            if (fileInput && fileInput.files[0]) {
                formData.append('uploaded_file', fileInput.files[0]);
            } else if (cameraInput && cameraInput.files[0]) {
                formData.append('uploaded_file', cameraInput.files[0]);
            }

            responseDiv.innerHTML = '<p class="loading">Solving... please wait ⏳</p>';
            solveBtn.disabled = true;

            try {
                const res = await fetch('/ask', {
                    method: 'POST',
                    body: formData
                });
                const data = await res.json();

                if (data.status === 'success') {
                    responseDiv.innerHTML = `<div class="answer">${formatResponse(data.response)}</div>`;
                    renderMath(responseDiv);
                } else {
                    responseDiv.innerHTML = `<p class="error">Error: ${data.error}</p>`;
                }
            } catch (err) {
                responseDiv.innerHTML = `<p class="error">Something went wrong: ${err.message}</p>`;
            } finally {
                solveBtn.disabled = false;
            }
        });
    }

    // ── QUIZ ──
    const quizBtn = document.getElementById('quizBtn');
    if (quizBtn) {
        quizBtn.addEventListener('click', async () => {
            const topic = document.getElementById('topic').value;
            const difficulty = document.getElementById('difficulty').value;
            const quizOutput = document.getElementById('quiz-output');

            const userInput = `Generate a ${difficulty} difficulty quiz on ${topic} in calculus.`;

            const formData = new FormData();
            formData.append('user_input', userInput);
            formData.append('response_type', 'quiz');

            quizOutput.innerHTML = '<p class="loading">Generating quiz... please wait ⏳</p>';
            quizBtn.disabled = true;

            try {
                const res = await fetch('/ask', {
                    method: 'POST',
                    body: formData
                });
                const data = await res.json();

                if (data.status === 'success') {
                    quizOutput.innerHTML = `<div class="answer">${formatResponse(data.response)}</div>`;
                    renderMath(quizOutput);
                } else {
                    quizOutput.innerHTML = `<p class="error">Error: ${data.error}</p>`;
                }
            } catch (err) {
                quizOutput.innerHTML = `<p class="error">Something went wrong: ${err.message}</p>`;
            } finally {
                quizBtn.disabled = false;
            }
        });
    }

    // ── FORMULA TABS ──
    const tabBtns = document.querySelectorAll('.tab-btn');
    if (tabBtns.length > 0) {
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                tabBtns.forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(tab => {
                    tab.classList.remove('active');
                });

                btn.classList.add('active');

                const targetTab = document.getElementById(btn.dataset.tab);
                if (targetTab) {
                    targetTab.classList.add('active');
                    renderMath(targetTab);
                }
            });
        });

        const activeTab = document.querySelector('.tab-content.active');
        if (activeTab) {
            renderMath(activeTab);
        }
    }

});
