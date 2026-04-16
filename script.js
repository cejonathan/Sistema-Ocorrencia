// ==========================================
// 1. CONFIGURAÇÕES E LOGIN
// ==========================================
const SUPABASE_URL = "https://fezxlibfvautquxyarhm.supabase.co";
const SUPABASE_KEY = "sb_publishable_e6F8ATGWLAemomRwmxoHGQ_B9REdJoi";

function getHeaders() {
    return { 
        'Content-Type': 'application/json', 
        'apikey': SUPABASE_KEY, 
        'Authorization': `Bearer ${localStorage.getItem('supabase_token') || SUPABASE_KEY}` 
    };
}

// Mapa de Agentes com Nome e Foto para o Cabeçalho
const mapaAgentes = {
    'det00@mobilidade.com': { nome: 'DET 00', foto: 'https://cdn-icons-png.flaticon.com/512/684/684065.png' },
    'det10@mobilidade.com': { nome: 'DET 10', foto: 'https://cdn-icons-png.flaticon.com/512/684/684065.png' }
};

// Info das Telas (WhatsApp Style)
const infoTelas = {
    'viatura': { nome: 'Viatura', sub: 'CONTROLE DE KM', foto: 'https://cdn-icons-png.flaticon.com/512/741/741407.png' },
    'ocorrencia': { nome: 'Ocorrências', sub: 'CENTRAL OPERACIONAL', foto: 'https://cdn-icons-png.flaticon.com/512/564/564619.png' },
    'relatorio': { nome: 'Relatórios', sub: 'SISTEMA DE ENVIO', foto: 'https://cdn-icons-png.flaticon.com/512/2991/2991108.png' }
};

const listaViaturas = ["AL 1389", "AL 1390", "AL 1391", "AL 1392", "AL 1393", "AL 1394", "AL 1395", "MH 01", "MH 02", "MH 03", "MH 04", "MH 05", "MH 06", "MH 07", "MH 08", "Sem viatura","Outro"];
const listaAgentes = ["DET 02", "DET 03", "DET 06", "DET 07", "DET 08", "DET 10", "DET 12", "DET 17", "DET 18", "DET 20", "DET 22", "DET 35", "DET 41", "DET 44", "DET 46", "DET 47", "DET 49", "DET 52", "DET 54", "DET 55", "DET 59", "DET 61", "DET 62", "DET 65", "DET 67", "DET 68", "DET 74", "DET 75", "DET 86", "DET 89", "DET 90", "Sem viatura", "Outro"];
const listaCodigos = ["1 - Acompanhamento de alunos", "2 - Apoio em obras", "3 - Apoio em events", "4 - Apoio ao agente de trânsito", "12 - Sinistro sem vítima", "13 - Sinistro com vítima", "30 - Remoção de veículo", "Outros"];
const listaSetores = ["Setor 1", "Setor 2", "Setor 3", "Setor 4", "Outros"];

let statusOperacao = JSON.parse(localStorage.getItem('statusVtr')) || { kmAberto: false, idDb: null };
let ocorrenciasAbertas = JSON.parse(localStorage.getItem('ocsAtivas')) || [];

// ==========================================
// 2. MOTOR DE TRAVA E CABEÇALHO
// ==========================================
function aplicarTravaIdentidade() {
    const email = localStorage.getItem('user_email');
    const dados = mapaAgentes[email];
    if (dados) {
        // Trava campos de Condutor
        const campos = ['km-condutor', 'oc-condutor'];
        campos.forEach(id => {
            const el = document.getElementById(id);
            if (el) { el.value = dados.nome; el.disabled = true; }
        });
        // Atualiza Home
        const nomeHome = document.querySelector('.agente-nome');
        if (nomeHome) nomeHome.innerText = dados.nome;
    }
}

function mudarCabecalhoPara(tipo) {
    const dados = infoTelas[tipo];
    if (!dados) return;
    document.getElementById('header-titulo').innerText = dados.nome;
    document.getElementById('header-sub').innerText = dados.sub;
    const icone = document.querySelector('.perfil-icon');
    if (icone) icone.innerHTML = `<img src="${dados.foto}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
}

function restaurarCabecalhoOriginal() {
    const email = localStorage.getItem('user_email');
    const dados = mapaAgentes[email];
    document.getElementById('header-titulo').innerText = dados ? dados.nome : 'Agente Trânsito';
    document.getElementById('header-sub').innerText = 'SISTEMA OPERACIONAL';
    document.querySelector('.perfil-icon').innerHTML = '<i class="fas fa-user"></i>';
}

// ==========================================
// 3. INICIALIZAÇÃO E AUTO-SAVE
// ==========================================
window.onload = function() {
    if (localStorage.getItem('supabase_token')) {
        liberarAplicativo();
        aplicarTravaIdentidade();
        carregarHistoricoKM();
        carregarHistoricoOC();
    }
    
    // Popular selects...
    popularSelect('km-viatura', listaViaturas);
    popularSelect('km-condutor', listaAgentes);
    popularSelect('km-apoio', listaAgentes);
    popularSelect('oc-viatura', listaViaturas);
    popularSelect('oc-condutor', listaAgentes);
    popularSelect('oc-apoio', listaAgentes);
    popularSelect('oc-codigo', listaCodigos);
    popularSelect('oc-local', listaSetores); 

    const hoje = new Date();
    if(document.getElementById('km-data')) document.getElementById('km-data').value = hoje.toLocaleDateString('en-CA');
    
    setHoraAtual('km-hora-inicial');
    setHoraAtual('oc-hora-inicial');
    aplicarAutoSave();

    if (statusOperacao.kmAberto) restaurarTelaKmAberto();
    if (ocorrenciasAbertas.length > 0) mostrarOcorrenciasAtivas();
    atualizarStatusHome();
};

function popularSelect(id, dados) {
    const s = document.getElementById(id); if (!s) return;
    s.innerHTML = '<option value="Selecionar">Selecionar</option>' + dados.map(i => `<option value="${i}">${i}</option>`).join('');
}

function setHoraAtual(id) {
    const agora = new Date();
    const el = document.getElementById(id);
    if(el) el.value = String(agora.getHours()).padStart(2, '0') + ":" + String(agora.getMinutes()).padStart(2, '0');
}

function aplicarAutoSave() {
    document.querySelectorAll('input, select, textarea').forEach(el => {
        const salvo = localStorage.getItem('auto_' + el.id);
        if (salvo && el.type !== 'password' && !el.disabled) el.value = salvo;
        el.addEventListener('input', () => { if (el.id) localStorage.setItem('auto_' + el.id, el.value); });
    });
}

function limparAutoSaveForm(formId) {
    const form = document.getElementById(formId);
    if(!form) return;
    form.querySelectorAll('input, select, textarea').forEach(el => {
        localStorage.removeItem('auto_' + el.id);
        if (el.type !== 'date' && el.type !== 'time' && el.tagName !== 'SELECT' && !el.disabled) el.value = '';
    });
}

// ==========================================
// 4. LOGIN
// ==========================================
const formLogin = document.getElementById('formLogin');
if(formLogin) {
    formLogin.addEventListener('submit', async function(e) {
        e.preventDefault();
        const btn = document.getElementById('btn-login');
        btn.innerText = "Aguarde..."; btn.disabled = true;
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-senha').value;

        try {
            const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
                method: 'POST',
                headers: { 'apikey': SUPABASE_KEY, 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (data.access_token) {
                localStorage.setItem('supabase_token', data.access_token);
                localStorage.setItem('user_email', email); // SALVA O EMAIL PARA A TRAVA
                liberarAplicativo();
                aplicarTravaIdentidade();
            } else { alert("Erro: Login incorreto."); }
        } catch(err) { alert("Erro de conexão."); }
        btn.innerText = "ENTRAR"; btn.disabled = false;
    });
}

function liberarAplicativo() { 
    document.getElementById('tela-login').classList.add('escondido'); 
    document.getElementById('app-principal').classList.remove('escondido'); 
}

// ==========================================
// 5. NAVEGAÇÃO
// ==========================================
function abrirChat(chatId, titulo, subtitulo) {
    document.getElementById('tela-lista-chats').style.display = 'none';
    document.querySelectorAll('.tela-chat').forEach(c => c.classList.remove('ativo'));
    document.getElementById(chatId).classList.add('ativo');
    document.getElementById('btn-voltar-home').style.display = 'block';

    if (chatId === 'chat-viatura') mudarCabecalhoPara('viatura');
    if (chatId === 'chat-ocorrencia') {
        mudarCabecalhoPara('ocorrencia');
        if (statusOperacao.kmAberto) {
            document.getElementById('oc-viatura').value = statusOperacao.viatura;
            document.getElementById('oc-condutor').value = statusOperacao.condutor;
            document.getElementById('oc-apoio').value = statusOperacao.apoio;
        }
    }
    if (chatId === 'chat-relatorio') mudarCabecalhoPara('relatorio');
}

function voltarParaHome() {
    document.querySelectorAll('.tela-chat').forEach(c => c.classList.remove('ativo'));
    document.getElementById('tela-lista-chats').style.display = 'block';
    document.getElementById('btn-voltar-home').style.display = 'none';
    restaurarCabecalhoOriginal();
}

// ==========================================
// 6. HISTÓRICOS (DETALHADOS)
// ==========================================
async function carregarHistoricoKM() {
    const container = document.getElementById('caixa-hist-km');
    if(!container) return;
    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/viaturas?order=created_at.desc&limit=10`, { headers: getHeaders() });
        const dados = await res.json();
        container.innerHTML = dados.map(item => `
            <div class="bolha-msg" style="padding:15px; margin-bottom:10px;">
                <b style="color:#5d48e7;">📅 ${new Date(item.data).toLocaleDateString('pt-BR')} | VTR: ${item.viatura}</b>
                <p style="font-size:13px; margin-top:5px;">👤 ${item.condutor} | 👥 ${item.apoio || 'Sem apoio'}</p>
                <p style="font-size:13px;">⏰ ${item.hora_inicial} ⮕ ${item.hora_final || 'Aberto'}</p>
                <p style="font-size:13px;">🏁 KM: ${item.km_inicial} ⮕ ${item.km_final || 'Aberto'}</p>
            </div>
        `).join('');
    } catch (err) { console.error(err); }
}

async function carregarHistoricoOC() {
    const container = document.getElementById('caixa-hist-oc');
    if(!container) return;
    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/ocorrencias?order=created_at.desc&limit=10`, { headers: getHeaders() });
        const dados = await res.json();
        container.innerHTML = dados.map(item => `
            <div class="bolha-msg" style="padding:15px; margin-bottom:10px;">
                <b style="color:#d32f2f;">🚨 ${item.protocolo || 'Pendente'} | ${item.codigo}</b>
                <p style="font-size:13px; margin-top:5px;">📍 ${item.local}</p>
                <p style="font-size:13px;">🚓 VTR: ${item.viatura} | 👤 ${item.condutor}</p>
                ${item.arquivos && item.arquivos !== 'Sem arquivos' ? `<a href="${item.arquivos}" target="_blank" style="color:#5d48e7; font-weight:bold; font-size:12px;">🖼️ Ver Foto</a>` : ''}
            </div>
        `).join('');
    } catch (err) { console.error(err); }
}

// ==========================================
// 7. LÓGICA DE ENVIO (OC E KM)
// ==========================================

// --- Form KM ---
const formKM = document.getElementById('formKM');
if (formKM) {
    formKM.addEventListener('submit', async function(e) {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        btn.innerText = "Enviando..."; btn.disabled = true;

        const payload = {
            data: document.getElementById('km-data').value,
            viatura: document.getElementById('km-viatura').value,
            condutor: document.getElementById('km-condutor').value,
            apoio: document.getElementById('km-apoio').value,
            km_inicial: document.getElementById('km-inicial').value,
            hora_inicial: document.getElementById('km-hora-inicial').value
        };

        try {
            const res = await fetch(`${SUPABASE_URL}/rest/v1/viaturas`, {
                method: 'POST', headers: { ...getHeaders(), 'Prefer': 'return=representation' }, body: JSON.stringify(payload)
            });
            const dados = await res.json();
            statusOperacao = { kmAberto: true, idDb: dados[0].id, ...payload };
            localStorage.setItem('statusVtr', JSON.stringify(statusOperacao));
            limparAutoSaveForm('formKM');
            restaurarTelaKmAberto();
            atualizarStatusHome();
        } catch (err) { alert("Erro ao abrir KM."); }
        btn.innerText = "➤ ENVIAR ABERTURA DE KM"; btn.disabled = false;
    });
}

function restaurarTelaKmAberto() {
    document.getElementById('info-vtr-ativa').innerText = `VTR: ${statusOperacao.viatura}`;
    document.getElementById('info-equipe-ativa').innerText = `Equipe: ${statusOperacao.condutor} / ${statusOperacao.apoio}`;
    document.getElementById('info-hora-ativa').innerText = `Aberto às: ${statusOperacao.hora_inicial}`;
    document.getElementById('tela-abrir-km').classList.add('escondido');
    document.getElementById('tela-km-aberto').classList.remove('escondido');
}

// --- Form Ocorrência ---
const formOc = document.getElementById('formOcorrencia');
if(formOc) {
    formOc.addEventListener('submit', async function(e) {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        btn.innerText = "Gerando Protocolo..."; btn.disabled = true;

        try {
            const ano = new Date().getFullYear();
            let prot = `1/${ano}`;
            const resB = await fetch(`${SUPABASE_URL}/rest/v1/ocorrencias?select=protocolo&protocolo=like.%25/${ano}&order=id.desc&limit=1`, { headers: getHeaders() });
            const dataB = await resB.json();
            if (dataB.length > 0) prot = `${parseInt(dataB[0].protocolo.split('/')[0]) + 1}/${ano}`;

            const novaOc = {
                protocolo: prot,
                data: document.getElementById('km-data').value,
                viatura: document.getElementById('oc-viatura').value,
                condutor: document.getElementById('oc-condutor').value,
                apoio: document.getElementById('oc-apoio').value,
                codigo: document.getElementById('oc-codigo').value,
                local: document.getElementById('oc-local').value,
                hora_inicial: document.getElementById('oc-hora-inicial').value
            };

            await fetch(`${SUPABASE_URL}/rest/v1/ocorrencias`, {
                method: 'POST', headers: getHeaders(), body: JSON.stringify(novaOc)
            });

            ocorrenciasAbertas.push(novaOc);
            localStorage.setItem('ocsAtivas', JSON.stringify(ocorrenciasAbertas));
            limparAutoSaveForm('formOcorrencia');
            document.getElementById('tela-oc-form').classList.add('escondido');
            mostrarOcorrenciasAtivas();
            atualizarStatusHome();
            alert("Ocorrência " + prot + " aberta!");
        } catch (err) { alert("Erro ao abrir."); }
        btn.innerText = "ABRIR OCORRÊNCIA"; btn.disabled = false;
    });
}

function atualizarStatusHome() {
    const stVtr = document.getElementById('status-vtr-home');
    if(stVtr) stVtr.innerText = statusOperacao.kmAberto ? `🟢 VTR ${statusOperacao.viatura} em operação` : `Toque para abrir KM...`;
}

function mostrarOcorrenciasAtivas() {
    document.getElementById('tela-oc-ativas').classList.remove('escondido');
    const container = document.getElementById('lista-ocorrencias-ativas');
    container.innerHTML = ocorrenciasAbertas.map((oc, i) => `
        <div class="status-box">
            <h3>🚨 EM ANDAMENTO: ${oc.protocolo}</h3>
            <p>${oc.codigo} | 📍 ${oc.local}</p>
            <button class="btn-acao btn-alerta mt-2" onclick="fecharOcorrencia(${i})">ENCERRAR</button>
        </div>
    `).join('');
}

// Funções auxiliares mantidas conforme o original
function verificarOutro(sel, idOut) {
    const el = document.getElementById(idOut);
    if (sel.value === 'Outro' || sel.value === 'Outros') el.classList.remove('escondido');
    else el.classList.add('escondido');
}
