// ==========================================
// 1. BANCO DE DADOS E MEMÓRIA
// ==========================================
const listaViaturas = ["Sem viatura", "AL 1389", "AL 1390", "AL 1391", "AL 1392", "AL 1393", "AL 1394", "AL 1395", "MH 01", "MH 02", "MH 03", "MH 04", "MH 05", "MH 06", "MH 07", "MH 08", "Outro"];
const listaAgentes = ["DET 02", "DET 03", "DET 06", "DET 07", "DET 08", "DET 10", "DET 12", "DET 17", "DET 18", "DET 20", "DET 22", "DET 35", "DET 41", "DET 44", "DET 46", "DET 47", "DET 49", "DET 52", "DET 54", "DET 55", "DET 59", "DET 61", "DET 62", "DET 65", "DET 67", "DET 68", "DET 74", "DET 75", "DET 86", "DET 89", "DET 90", "Outro"];
const listaCodigos = ["1 - Acompanhamento de alunos", "2 - Apoio em obras", "3 - Apoio em eventos", "4 - Apoio ao agente de trânsito", "5 - Acompanhamento de veículos (escolta)", "6 - Fiscalização de caminhão", "7 - COI", "8 - Ação educativa", "9 - Autorização de caçamba/caminhão", "10 - Apoio órgão público/EDP/Telefonia", "11 - Monitoramento", "12 - Sinistro de trânsito sem vítima", "13 - Sinistro de trânsito com vítima", "14 - Animais na pista", "15 - Trabalho administrativo", "16 - Transporte interno", "17 - Solicitação de munícipe", "18 - Operação em semáforo", "19 - Fiscalização em circulação", "20 - Apoio a veículo quebrado", "21 - Travessia de alunos", "22 - Apoio a feira livre", "23 - Desvio de trânsito", "24 - Deslocamento ao centro do servidor", "25 - Apoio a eventos religiosos", "26 - Aferição de radar", "27 - Autorizar veículos a passar no vermelho", "28 - Manutenção da VTR", "29 - Obra SAAE", "30 - Remoção de veículo", "31 - Remoção de veículo abandonado", "32 - Apoio a pintura", "33 - Apoio a poda de árvore", "34 - Apoio a troca de poste/Recolha de fios caídos", "35 - Deslocamento para diretoria de trânsito", "36 - Deslocamento para limpar VTR", "37 - Blitz", "38 - Fiscalização em extensão", "39 - Controle de fluxo", "40 - Fiscalização em ponto fixo", "41 - Posturas", "42 - Vistoria", "Outros"];
const listaSetores = ["Setor 1", "Setor 2", "Setor 3", "Setor 4", "Setor 5", "Setor 6", "Setor 7", "Setor 8", "Setor 9", "Setor 10", "Setor 11", "Setor 12", "Setor 13", "Setor 14", "Setor 15", "Outros"];

let statusOperacao = { kmAberto: false, viatura: '', condutor: '', apoio: '', horaInicial: '' };
let ocorrenciasAbertas = []; // Guarda todas as ocorrências ativas

// ==========================================
// 2. FUNÇÕES DE INICIALIZAÇÃO
// ==========================================

function popularSelect(idElemento, arrayDados) {
    const select = document.getElementById(idElemento);
    select.innerHTML = '<option value="Selecionar" selected>Selecionar</option>';
    arrayDados.forEach(item => {
        select.innerHTML += `<option value="${item}">${item}</option>`;
    });
}

function setHoraAtual(idInput) {
    const agora = new Date();
    const horas = String(agora.getHours()).padStart(2, '0');
    const minutos = String(agora.getMinutes()).padStart(2, '0');
    document.getElementById(idInput).value = `${horas}:${minutos}`;
}

window.onload = function() {
    popularSelect('km-viatura', listaViaturas);
    popularSelect('km-condutor', listaAgentes);
    popularSelect('km-apoio', listaAgentes);
    
    popularSelect('oc-viatura', listaViaturas);
    popularSelect('oc-condutor', listaAgentes);
    popularSelect('oc-apoio', listaAgentes);
    popularSelect('oc-codigo', listaCodigos);
    popularSelect('oc-local', listaSetores); 
    
    // RESOLVENDO O BUG DA DATA (Forçando horário local e não UTC)
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    document.getElementById('km-data').value = `${ano}-${mes}-${dia}`;
    
    setHoraAtual('km-hora-inicial');
    setHoraAtual('oc-hora-inicial');
};

// ==========================================
// 3. FUNÇÕES DE INTERFACE
// ==========================================

function abrirAba(idAba) {
    document.querySelectorAll('.tab-painel').forEach(p => p.classList.remove('ativo'));
    document.querySelectorAll('.btn-tab').forEach(b => b.classList.remove('ativa'));
    
    document.getElementById(idAba).classList.add('ativo');
    let indexBotao = Array.from(document.getElementById(idAba).parentNode.children).indexOf(document.getElementById(idAba));
    document.querySelectorAll('.btn-tab')[indexBotao].classList.add('ativa');

    // Auto preenchimento da ocorrência se o KM estiver aberto
    if (idAba === 'tab-ocorrencia' && statusOperacao.kmAberto) {
        document.getElementById('oc-viatura').value = statusOperacao.viatura;
        document.getElementById('oc-condutor').value = statusOperacao.condutor;
        if(statusOperacao.apoio !== "Selecionar" && statusOperacao.apoio !== "") {
            document.getElementById('oc-apoio').value = statusOperacao.apoio;
        }
    }
}

function abrirSubTela(idSubTela, btnElement) {
    const painel = btnElement.closest('.tab-painel');
    painel.querySelectorAll('.sub-tela').forEach(t => t.classList.remove('ativa'));
    painel.querySelectorAll('.btn-subtab').forEach(b => b.classList.remove('ativa'));

    document.getElementById(idSubTela).classList.add('ativa');
    btnElement.classList.add('ativa');
}

function verificarOutro(selectElement, idInputTexto) {
    const inputTexto = document.getElementById(idInputTexto);
    if (selectElement.value === 'Outro' || selectElement.value === 'Outros') {
        inputTexto.classList.remove('escondido');
        inputTexto.setAttribute('required', 'true');
    } else {
        inputTexto.classList.add('escondido');
        inputTexto.removeAttribute('required');
        inputTexto.value = ''; 
    }
}

// ==========================================
// 4. LÓGICA DO KM
// ==========================================

document.getElementById('formKM').addEventListener('submit', function(e) {
    e.preventDefault();
    
    let vtr = document.getElementById('km-viatura').value;
    vtr = (vtr === 'Outro' || vtr === 'Outros') ? document.getElementById('km-viatura-outro').value : vtr;

    let cond = document.getElementById('km-condutor').value;
    cond = (cond === 'Outro' || cond === 'Outros') ? document.getElementById('km-condutor-outro').value : cond;

    let ap = document.getElementById('km-apoio').value;
    ap = (ap === 'Outro' || ap === 'Outros') ? document.getElementById('km-apoio-outro').value : ap;

    let horaIni = document.getElementById('km-hora-inicial').value;
    let textoApoio = (ap === 'Selecionar' || ap === '') ? 'Sem apoio' : ap;

    statusOperacao = { kmAberto: true, viatura: vtr, condutor: cond, apoio: ap, horaInicial: horaIni };

    document.getElementById('info-vtr-ativa').innerText = `VTR: ${vtr}`;
    document.getElementById('info-equipe-ativa').innerText = `Equipe: ${cond} / ${textoApoio}`;
    document.getElementById('info-hora-ativa').innerText = `Aberto às: ${horaIni}`;

    document.getElementById('tela-abrir-km').classList.add('escondido');
    document.getElementById('tela-km-aberto').classList.remove('escondido');
});

function editarKM() {
    document.getElementById('tela-km-aberto').classList.add('escondido');
    document.getElementById('tela-abrir-km').classList.remove('escondido');
}

// ==========================================
// 5. LÓGICA DAS OCORRÊNCIAS
// ==========================================

// Quando clica em "ABRIR OCORRÊNCIA"
document.getElementById('formOcorrencia').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Captura o código e hora para exibir no card
    let cod = document.getElementById('oc-codigo').value;
    cod = (cod === 'Outro' || cod === 'Outros') ? document.getElementById('oc-codigo-outro').value : cod;
    
    let local = document.getElementById('oc-local').value;
    local = (local === 'Outro' || local === 'Outros') ? document.getElementById('oc-local-outro').value : local;
    
    let horaIni = document.getElementById('oc-hora-inicial').value;

    // Cria um objeto para esta ocorrência e salva na lista
    const novaOcorrencia = {
        id: Date.now(), // ID único
        codigo: cod,
        local: local,
        horaInicial: horaIni
    };
    
    ocorrenciasAbertas.push(novaOcorrencia);
    
    // Mostra o botão "VER OCORRÊNCIAS ABERTAS" no formulário
    document.getElementById('btnVerAbertas').classList.remove('escondido');
    
    mostrarOcorrenciasAtivas();
});

// Atualiza a tela com a lista de ocorrências e esconde o formulário
function mostrarOcorrenciasAtivas() {
    document.getElementById('tela-oc-form').classList.add('escondido');
    document.getElementById('tela-oc-ativas').classList.remove('escondido');
    
    const container = document.getElementById('lista-ocorrencias-ativas');
    container.innerHTML = ''; // Limpa a lista antes de recriar
    
    ocorrenciasAbertas.forEach((oc, index) => {
        container.innerHTML += `
            <div class="status-box">
                <h3 style="color:#d9534f;">🚨 Cód: ${oc.codigo}</h3>
                <p><strong>Local:</strong> ${oc.local}</p>
                <p><strong>Início:</strong> ${oc.horaInicial}</p>
                
                <div class="campo-grupo mt-4" style="text-align:left;">
                    <label>HORA FINAL</label>
                    <div style="display:flex; gap:5px;">
                        <input type="time" id="oc-hora-final-${index}" style="background:white;">
                        <button type="button" onclick="setHoraAtual('oc-hora-final-${index}')" style="padding: 0 10px; border-radius:4px; border:1px solid #ccc; cursor:pointer;">⏱️</button>
                    </div>
                </div>
                <button type="button" class="btn-acao btn-alerta mt-2" onclick="fecharOcorrencia(${index})">FECHAR ESTA OCORRÊNCIA</button>
            </div>
        `;
    });
}

// Volta para o formulário para registrar mais uma
function prepararNovaOcorrencia() {
    document.getElementById('tela-oc-ativas').classList.add('escondido');
    document.getElementById('tela-oc-form').classList.remove('escondido');
    
    // Limpa os campos específicos da ocorrência, mas mantém a equipe
    document.getElementById('oc-codigo').value = "Selecionar";
    document.getElementById('oc-local').value = "Selecionar";
    document.getElementById('oc-observacoes').value = "";
    setHoraAtual('oc-hora-inicial');
}

// Fecha uma ocorrência específica da lista
function fecharOcorrencia(index) {
    const horaFinalInput = document.getElementById(`oc-hora-final-${index}`);
    if(!horaFinalInput.value) {
        alert("Por favor, preencha a HORA FINAL para fechar a ocorrência.");
        return;
    }
    
    // Aqui no futuro você enviará os dados pro Google Sheets!
    
    // Remove da lista
    ocorrenciasAbertas.splice(index, 1);
    
    if (ocorrenciasAbertas.length === 0) {
        // Se fechou todas, volta pro formulário limpo
        document.getElementById('btnVerAbertas').classList.add('escondido');
        prepararNovaOcorrencia();
        alert("Todas as ocorrências foram finalizadas!");
    } else {
        // Se ainda tem outras abertas, atualiza a tela
        mostrarOcorrenciasAtivas();
    }
}