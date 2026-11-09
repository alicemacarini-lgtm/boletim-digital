// Configuração fixa do aluno
const CONFIG_ALUNO = {
  turma: "8C",
  numeroChamada: 28,
  apiUrl: "https://boletim-api.profbt.com.br"
};

// PIN mantido exclusivamente em memória durante a sessão
let pinSessao = "";

// Modo de edição desativado por padrão
let modoEdicao = false;

// Dados fictícios padronizados do 8º Ano
const dadosBoletimPadrao = [
  { disciplina: "Língua Portuguesa", tri1: 82, tri2: "7,8", tri3: 85, faltas: [2, 1, 1] },
  { disciplina: "Matemática", tri1: 52, tri2: "5,8", tri3: null, faltas: [3, 2, 1] },
  { disciplina: "Ciências", tri1: "8,1", tri2: 76, tri3: 8.0, faltas: [1, 2, 0] },
  { disciplina: "História", tri1: 7.0, tri2: 84, tri3: null, faltas: [1, 1, 1] },
  { disciplina: "Geografia", tri1: 68, tri2: 7.3, tri3: "7,9", faltas: [0, 1, 1] },
  { disciplina: "Língua Inglesa", tri1: 86, tri2: "8,1", tri3: 8.7, faltas: [1, 0, 0] },
  { disciplina: "Arte", tri1: 9.0, tri2: 92, tri3: null, faltas: [1, 1, 0] },
  { disciplina: "Educação Física", tri1: 95, tri2: 9.0, tri3: "9,4", faltas: [0, 1, 0] },
  { disciplina: "Educação Digital", tri1: 88, tri2: 9.1, tri3: 93, faltas: [1, 0, 1] },
  { disciplina: "Educação Financeira", tri1: 74, tri2: "7,8", tri3: null, faltas: [1, 1, 1] },
  { disciplina: "Estudo Orientado", tri1: 8.0, tri2: 83, tri3: "8,5", faltas: [0, 1, 0] },
  { disciplina: "Redação e Leitura", tri1: 62, tri2: "6,8", tri3: null, faltas: [2, 1, 1] },
  { disciplina: "Pensamento Lógico", tri1: 48, tri2: 5.6, tri3: "6,0", faltas: [2, 2, 1] },
  { disciplina: "Literatura Arte e Movimento", tri1: "7,7", tri2: 80, tri3: null, faltas: [1, 0, 1] },
  { disciplina: "Práticas Experimentais", tri1: 58, tri2: "6,2", tri3: 6.4, faltas: [1, 1, 1] }
];

// Estado atual dos dados exibidos na página
let dadosAtuais = [];

// Instâncias dos gráficos (Chart.js)
let graficoMedias = null;
let graficoEvolucao = null;
let graficoFaltas = null;

// Função para normalizar qualquer valor de nota para a escala de 0 a 10 (Dados antigos/locais)
function normalizarNota(valor) {
    if (valor === null || valor === undefined || valor === "") {
        return null;
    }

    if (typeof valor === "string") {
        valor = valor.replace(",", ".");
    }

    let numero = Number(valor);

    if (isNaN(numero)) {
        return null;
    }

    if (numero > 10 && numero <= 100) {
        numero = numero / 10;
    }

    if (numero >= 0 && numero <= 10) {
        return numero;
    }

    return null;
}

// Normalização genérica para converter array de faltas em array de 3 números inteiros
function normalizarFaltas(faltas) {
    if (!Array.isArray(faltas)) {
        return [0, 0, 0];
    }
    return [
        Number(faltas[0]) || 0,
        Number(faltas[1]) || 0,
        Number(faltas[2]) || 0
    ];
}

// Função principal que calcula e renderiza os dados na tabela e nos cards
function renderizarBoletim() {
    const tabelaBody = document.getElementById("tabela-boletim");
    tabelaBody.innerHTML = "";

    let somaMedias = 0;
    let totalDisciplinasComMedia = 0;
    let totalFaltasGeral = 0;
    let bomDesempenhoCount = 0;
    let atencaoCount = 0;

    dadosAtuais.forEach((item, index) => {
        const n1 = normalizarNota(item.tri1);
        const n2 = normalizarNota(item.tri2);
        const n3 = normalizarNota(item.tri3);

        const notasValidas = [n1, n2, n3].filter(n => n !== null);
        let media = null;
        let situacaoTexto = "Nota ainda não disponível";
        let situacaoClasse = "status-indisponivel";

        if (notasValidas.length > 0) {
            const soma = notasValidas.reduce((acc, curr) => acc + curr, 0);
            media = soma / notasValidas.length;
            somaMedias += media;
            totalDisciplinasComMedia++;

            if (media >= 6.0) {
                situacaoTexto = "Bom desempenho";
                situacaoClasse = "status-bom";
                bomDesempenhoCount++;
            } else {
                situacaoTexto = "Atenção";
                situacaoClasse = "status-atencao";
                atencaoCount++;
            }
        }

        const faltasArray = normalizarFaltas(item.faltas);
        const totalFaltasDisciplina = faltasArray.reduce((acc, curr) => acc + curr, 0);
        totalFaltasGeral += totalFaltasDisciplina;

        const tr = document.createElement("tr");

        if (!modoEdicao) {
            const t1Text = n1 !== null ? n1.toFixed(1).replace(".", ",") : "—";
            const t2Text = n2 !== null ? n2.toFixed(1).replace(".", ",") : "—";
            const t3Text = n3 !== null ? n3.toFixed(1).replace(".", ",") : "—";
            const mediaText = media !== null ? media.toFixed(1).replace(".", ",") : "—";

            // DOM seguro usando textContent para o nome da disciplina
            const tdNome = document.createElement("td");
            const strongNome = document.createElement("strong");
            strongNome.textContent = item.disciplina;
            tdNome.appendChild(strongNome);

            const td1 = document.createElement("td");
            td1.textContent = t1Text;

            const td2 = document.createElement("td");
            td2.textContent = t2Text;

            const td3 = document.createElement("td");
            td3.textContent = t3Text;

            const tdMedia = document.createElement("td");
            const strongMedia = document.createElement("strong");
            strongMedia.textContent = mediaText;
            tdMedia.appendChild(strongMedia);

            const tdFaltas = document.createElement("td");
            tdFaltas.textContent = totalFaltasDisciplina;

            const tdSit = document.createElement("td");
            const spanSit = document.createElement("span");
            spanSit.className = situacaoClasse;
            spanSit.textContent = situacaoTexto;
            tdSit.appendChild(spanSit);

            tr.appendChild(tdNome);
            tr.appendChild(td1);
            tr.appendChild(td2);
            tr.appendChild(td3);
            tr.appendChild(tdMedia);
            tr.appendChild(tdFaltas);
            tr.appendChild(tdSit);
        } else {
            // Renderização no modo de edição
            const tdNome = document.createElement("td");
            const strongNome = document.createElement("strong");
            strongNome.textContent = item.disciplina;
            tdNome.appendChild(strongNome);

            const formatarInputNota = (v) => {
                const norm = normalizarNota(v);
                return norm !== null ? String(norm).replace(".", ",") : "";
            };

            const td1 = document.createElement("td");
            td1.innerHTML = `<input type="text" class="input-edicao input-nota" data-index="${index}" data-tri="1" value="${formatarInputNota(item.tri1)}">`;

            const td2 = document.createElement("td");
            td2.innerHTML = `<input type="text" class="input-edicao input-nota" data-index="${index}" data-tri="2" value="${formatarInputNota(item.tri2)}">`;

            const td3 = document.createElement("td");
            td3.innerHTML = `<input type="text" class="input-edicao input-nota" data-index="${index}" data-tri="3" value="${formatarInputNota(item.tri3)}">`;

            const mediaText = media !== null ? media.toFixed(1).replace(".", ",") : "—";
            const tdMedia = document.createElement("td");
            tdMedia.innerHTML = `<strong>${mediaText}</strong>`;

            const tdFaltas = document.createElement("td");
            tdFaltas.innerHTML = `
                <div class="faltas-edicao-container">
                    <input type="text" class="input-edicao input-falta" data-index="${index}" data-tri="1" value="${faltasArray[0]}" title="Faltas 1º Tri">
                    <input type="text" class="input-edicao input-falta" data-index="${index}" data-tri="2" value="${faltasArray[1]}" title="Faltas 2º Tri">
                    <input type="text" class="input-edicao input-falta" data-index="${index}" data-tri="3" value="${faltasArray[2]}" title="Faltas 3º Tri">
                </div>
            `;

            const tdSit = document.createElement("td");
            const spanSit = document.createElement("span");
            spanSit.className = situacaoClasse;
            spanSit.textContent = situacaoTexto;
            tdSit.appendChild(spanSit);

            tr.appendChild(tdNome);
            tr.appendChild(td1);
            tr.appendChild(td2);
            tr.appendChild(td3);
            tr.appendChild(tdMedia);
            tr.appendChild(tdFaltas);
            tr.appendChild(tdSit);
        }

        tabelaBody.appendChild(tr);
    });

    // Atualização dos Cards Resumo
    const mediaGeral = totalDisciplinasComMedia > 0 ? (somaMedias / totalDisciplinasComMedia).toFixed(1).replace(".", ",") : "—";
    document.getElementById("card-media-geral").textContent = mediaGeral;
    document.getElementById("card-total-faltas").textContent = totalFaltasGeral;
    document.getElementById("card-bom-desempenho").textContent = bomDesempenhoCount;
    document.getElementById("card-atencao").textContent = atencaoCount;

    // Atualização em camada de leitura dos 3 gráficos visuais
    atualizarGraficos();
}

// -------------------------------------------------------------
// FUNÇÕES EXCLUSIVAS DOS GRÁFICOS (SOMENTE LEITURA DO ESTADO)
// -------------------------------------------------------------

function atualizarGraficoMedias() {
    const canvas = document.getElementById("graficoMediasDisciplinas");
    if (!canvas) return;

    if (graficoMedias) {
        graficoMedias.destroy();
    }

    const labels = [];
    const valoresMedias = [];

    dadosAtuais.forEach(item => {
        labels.push(item.disciplina);

        const n1 = normalizarNota(item.tri1);
        const n2 = normalizarNota(item.tri2);
        const n3 = normalizarNota(item.tri3);

        const notasValidas = [n1, n2, n3].filter(n => n !== null);
        if (notasValidas.length > 0) {
            const soma = notasValidas.reduce((acc, curr) => acc + curr, 0);
            valoresMedias.push(Number((soma / notasValidas.length).toFixed(1)));
        } else {
            valoresMedias.push(null);
        }
    });

    const ctx = canvas.getContext("2d");
    graficoMedias = new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [{
                label: "Média Atual",
                data: valoresMedias,
                backgroundColor: "rgba(123, 104, 238, 0.7)",
                borderColor: "#7b68ee",
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            indexAxis: "y",
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    min: 0,
                    max: 10,
                    ticks: { color: "#4a4e69" },
                    grid: { color: "rgba(230, 220, 240, 0.5)" }
                },
                y: {
                    ticks: { color: "#4a4e69", font: { size: 11 } },
                    grid: { display: false }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const val = context.raw;
                            if (val === null || val === undefined) return " Sem nota";
                            return ` Média: ${String(val).replace(".", ",")}`;
                        }
                    }
                }
            }
        }
    });
}

function atualizarGraficoEvolucao() {
    const canvas = document.getElementById("graficoEvolucaoTrimestres");
    if (!canvas) return;

    if (graficoEvolucao) {
        graficoEvolucao.destroy();
    }

    const somaTrimestres = [0, 0, 0];
    const contaTrimestres = [0, 0, 0];

    dadosAtuais.forEach(item => {
        const n1 = normalizarNota(item.tri1);
        const n2 = normalizarNota(item.tri2);
        const n3 = normalizarNota(item.tri3);

        if (n1 !== null) { somaTrimestres[0] += n1; contaTrimestres[0]++; }
        if (n2 !== null) { somaTrimestres[1] += n2; contaTrimestres[1]++; }
        if (n3 !== null) { somaTrimestres[2] += n3; contaTrimestres[2]++; }
    });

    const mediasTrimestres = [
        contaTrimestres[0] > 0 ? Number((somaTrimestres[0] / contaTrimestres[0]).toFixed(1)) : null,
        contaTrimestres[1] > 0 ? Number((somaTrimestres[1] / contaTrimestres[1]).toFixed(1)) : null,
        contaTrimestres[2] > 0 ? Number((somaTrimestres[2] / contaTrimestres[2]).toFixed(1)) : null
    ];

    const ctx = canvas.getContext("2d");
    graficoEvolucao = new Chart(ctx, {
        type: "line",
        data: {
            labels: ["1º Tri", "2º Tri", "3º Tri"],
            datasets: [{
                label: "Média Geral",
                data: mediasTrimestres,
                borderColor: "#6b4c9a",
                backgroundColor: "rgba(107, 76, 154, 0.15)",
                fill: true,
                tension: 0.3,
                pointBackgroundColor: "#7b68ee",
                pointRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    min: 0,
                    max: 10,
                    ticks: { color: "#4a4e69" },
                    grid: { color: "rgba(230, 220, 240, 0.5)" }
                },
                x: {
                    ticks: { color: "#4a4e69" },
                    grid: { display: false }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const val = context.raw;
                            if (val === null || val === undefined) return " Sem notas";
                            return ` Média Geral: ${String(val).replace(".", ",")}`;
                        }
                    }
                }
            }
        }
    });
}

function atualizarGraficoFaltas() {
    const canvas = document.getElementById("graficoFaltasTrimestres");
    if (!canvas) return;

    if (graficoFaltas) {
        graficoFaltas.destroy();
    }

    let faltasTri1 = 0;
    let faltasTri2 = 0;
    let faltasTri3 = 0;

    dadosAtuais.forEach(item => {
        const f = normalizarFaltas(item.faltas);
        faltasTri1 += f[0];
        faltasTri2 += f[1];
        faltasTri3 += f[2];
    });

    const totalFaltasAcumulado = faltasTri1 + faltasTri2 + faltasTri3;
    const LIMITE_REFERENCIA_INTERNA = 350;

    const divEstado = document.getElementById("estadoFaltas");
    const cardFaltasContainer = document.getElementById("cardFaltasTrimestres");

    if (totalFaltasAcumulado >= LIMITE_REFERENCIA_INTERNA) {
        if (divEstado) divEstado.innerHTML = `<span class="badge-perigo">Perigo</span>`;
        if (cardFaltasContainer) cardFaltasContainer.classList.add("card-critico");
    } else {
        if (divEstado) divEstado.innerHTML = "";
        if (cardFaltasContainer) cardFaltasContainer.classList.remove("card-critico");
    }

    const ctx = canvas.getContext("2d");
    graficoFaltas = new Chart(ctx, {
        type: "bar",
        data: {
            labels: ["1º Tri", "2º Tri", "3º Tri"],
            datasets: [{
                label: "Faltas",
                data: [faltasTri1, faltasTri2, faltasTri3],
                backgroundColor: [
                    "rgba(154, 122, 160, 0.7)",
                    "rgba(123, 104, 238, 0.7)",
                    "rgba(107, 76, 154, 0.7)"
                ],
                borderColor: "#6b4c9a",
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: "#4a4e69", precision: 0 },
                    grid: { color: "rgba(230, 220, 240, 0.5)" }
                },
                x: {
                    ticks: { color: "#4a4e69" },
                    grid: { display: false }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return ` Faltas: ${context.raw}`;
                        }
                    }
                }
            }
        }
    });
}

function atualizarGraficos() {
    atualizarGraficoMedias();
    atualizarGraficoEvolucao();
    atualizarGraficoFaltas();
}

// -------------------------------------------------------------
// EVENTOS DE AUTENTICAÇÃO, EDIÇÃO E PERSISTÊNCIA (NÚCLEO MANTIDO)
// -------------------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {
    const btnEntrar = document.getElementById("btn-entrar");
    const inputPin = document.getElementById("input-pin");
    const mensagemAcesso = document.getElementById("mensagem-acesso");

    const btnAlternarEdicao = document.getElementById("btn-alternar-edicao");
    const btnSalvar = document.getElementById("btn-salvar");
    const mensagemEdicao = document.getElementById("mensagem-edicao");

    if (btnEntrar) {
        btnEntrar.addEventListener("click", () => {
            const pinDigitado = inputPin.value.trim();
            if (!pinDigitado) {
                mensagemAcesso.className = "mensagem-status erro";
                mensagemAcesso.textContent = "Por favor, digite o PIN.";
                return;
            }

            pinSessao = pinDigitado;
            dadosAtuais = JSON.parse(JSON.stringify(dadosBoletimPadrao));

            document.getElementById("secao-acesso").style.display = "none";
            document.getElementById("conteudo-boletim").style.display = "block";

            renderizarBoletim();
        });
    }

    if (btnAlternarEdicao) {
        btnAlternarEdicao.addEventListener("click", () => {
            modoEdicao = !modoEdicao;

            if (modoEdicao) {
                btnAlternarEdicao.textContent = "Cancelar";
                btnSalvar.style.display = "inline-block";
                mensagemEdicao.textContent = "";
            } else {
                btnAlternarEdicao.textContent = "Alterar dados";
                btnSalvar.style.display = "none";
                mensagemEdicao.textContent = "";
            }

            renderizarBoletim();
        });
    }

    if (btnSalvar) {
        btnSalvar.addEventListener("click", () => {
            let temErro = false;

            document.querySelectorAll(".input-nota").forEach(input => {
                const val = input.value.trim();
                if (val !== "") {
                    const norm = normalizarNota(val);
                    if (norm === null) {
                        input.classList.add("invalido");
                        temErro = true;
                    } else {
                        input.classList.remove("invalido");
                    }
                } else {
                    input.classList.remove("invalido");
                }
            });

            document.querySelectorAll(".input-falta").forEach(input => {
                const val = input.value.trim();
                const num = Number(val);
                if (val === "" || isNaN(num) || num < 0 || !Number.isInteger(num)) {
                    input.classList.add("invalido");
                    temErro = true;
                } else {
                    input.classList.remove("invalido");
                }
            });

            if (temErro) {
                mensagemEdicao.className = "mensagem-status erro";
                mensagemEdicao.textContent = "Por favor, corrija os campos destacados em vermelho.";
                return;
            }

            // Aplicar alterações
            document.querySelectorAll(".input-nota").forEach(input => {
                const idx = Number(input.dataset.index);
                const tri = input.dataset.tri;
                const val = input.value.trim();
                const norm = normalizarNota(val);

                if (tri === "1") dadosAtuais[idx].tri1 = norm;
                if (tri === "2") dadosAtuais[idx].tri2 = norm;
                if (tri === "3") dadosAtuais[idx].tri3 = norm;
            });

            document.querySelectorAll(".input-falta").forEach(input => {
                const idx = Number(input.dataset.index);
                const tri = Number(input.dataset.tri) - 1;
                const val = Number(input.value.trim());

                if (!Array.isArray(dadosAtuais[idx].faltas)) {
                    dadosAtuais[idx].faltas = [0, 0, 0];
                }
                dadosAtuais[idx].faltas[tri] = val;
            });

            modoEdicao = false;
            btnAlternarEdicao.textContent = "Alterar dados";
            btnSalvar.style.display = "none";
            mensagemEdicao.className = "mensagem-status sucesso";
            mensagemEdicao.textContent = "Dados salvos com sucesso!";

            renderizarBoletim();
        });
    }
});