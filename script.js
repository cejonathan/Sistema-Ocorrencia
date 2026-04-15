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

const listaViaturas = ["AL 1389", "AL 1390", "AL 1391", "AL 1392", "AL 1393", "AL 1394", "AL 1395", "MH 01", "MH 02", "MH 03", "MH 04", "MH 05", "MH 06", "MH 07", "MH 08", "Sem viatura","Outro"];
const listaAgentes = ["DET 02", "DET 03", "DET 06", "DET 07", "DET 08", "DET 10", "DET 12", "DET 17", "DET 18", "DET 20", "DET 22", "DET 35", "DET 41", "DET 44", "DET 46", "DET 47", "DET 49", "DET 52", "DET 54", "DET 55", "DET 59", "DET 61", "DET 62", "DET 65", "DET 67", "DET 68", "DET 74", "DET 75", "DET 86", "DET 89", "DET 90", "Sem viatura", "Outro"];
const listaCodigos = ["1 - Acompanhamento de alunos", "2 - Apoio em obras", "3 - Apoio em events", "4 - Apoio ao agente de trânsito", "5 - Acompanhamento de veículos (escolta)", "6 - Fiscalização de caminhão", "7 - COI", "8 - Ação educativa", "9 - Autorização de caçamba/caminhão", "10 - Apoio órgão público/EDP/Telefonia", "11 - Monitoramento", "12 - Sinistro de trânsito sem vítima", "13 - Sinistro de trânsito com vítima", "14 - Animais na pista", "15 - Trabalho administrativo", "16 - Transporte interno", "17 - Solicitação de munícipe", "18 - Operação em semáforo", "19 - Fiscalização em circulação", "20 - Apoio a veículo quebrado", "21 - Travessia de alunos", "22 - Apoio a feira livre", "23 - Desvio de trânsito", "24 - Deslocamento ao centro do servidor", "25 - Apoio a eventos religiosos", "26 - Aferição de radar", "27 - Autorizar veículos a passar no vermelho", "28 - Manutenção da VTR", "29 - Obra SAAE", "30 - Remoção de veículo", "31 - Remoção de veículo abandonado", "32 - Apoio a pintura", "33 - Apoio a poda de árvore", "34 - Apoio a troca de poste/Recolha de fios caídos", "35 - Deslocamento para diretoria de trânsito", "36 - Deslocamento para limpar VTR", "37 - Blitz", "38 - Fiscalização em extensão", "39 - Controle de fluxo", "40 - Fiscalização em ponto fixo", "41 - Posturas", "42 - Vistoria", "Outros"];
const listaSetores = ["Setor 1", "Setor 2", "Setor 3", "Setor 4", "Setor 5", "Setor 6", "Setor 7", "Setor 8", "Setor 9", "Setor 10", "Setor 11", "Setor 12", "Setor 13", "Setor 14", "Setor 15", "Outros"];

let statusOperacao = JSON.parse(localStorage.getItem('statusVtr')) || { kmAberto: false, idDb: null };
let ocorrenciasAbertas = JSON.parse(localStorage.getItem('ocsAtivas')) || [];

// ==========================================
// 2. MOTOR AUTO-SAVE (SALVAMENTO AUTOMÁTICO)
// ==========================================
function aplicarAutoSave() {
    const elementos = document.querySelectorAll('input, select, textarea');
    elementos.forEach(el => {
        // Carrega o que estava salvo
        const salvo = localStorage.getItem('auto_' + el.id);
        if (salvo && el.type !== 'password' && el.type !== 'file') {
            el.value = salvo;
        }
        // Ouve mudanças e salva
        el.addEventListener('input', () => {
            if (el.id) localStorage.setItem('auto_' + el.id, el.value);
        });
    });
}

// Limpa o auto-save apenas de um formulário específico após o envio bem-sucedido
function limparAutoSaveForm(formId) {
    const form = document.getElementById(formId);
    const elementos = form.querySelectorAll('input, select, textarea');
    elementos.forEach(el => {
        localStorage.removeItem('auto_' + el.id);
        if (el.type !== 'date' && el.type !== 'time' && el.tagName !== 'SELECT') el.value = '';
    });
}

// ==========================================
// 3. INICIALIZAÇÃO
// ==========================================
window.onload = function() {
    if (localStorage.getItem('supabase_token')) liberarAplicativo();

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
    if (ocorrenciasAbertas.length > 0) {
        document.getElementById('btnVerAbertas').classList.remove('escondido');
        mostrarOcorrenciasAtivas();
    }
};

function popularSelect(id, dados) {
    const s = document.getElementById(id); if (!s) return;
    s.innerHTML = '<option value="Selecionar">Selecionar</option>' + dados.map(i => `<option value="${i}">${i}</option>`).join('');
}

function setHoraAtual(id) {
    const agora = new Date();
    document.getElementById(id).value = String(agora.getHours()).padStart(2, '0') + ":" + String(agora.getMinutes()).padStart(2, '0');
}

// ==========================================
// 4. LOGIN E RENOVAÇÃO
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
                localStorage.setItem('supabase_refresh_token', data.refresh_token);
                liberarAplicativo();
            } else {
                alert("Erro: E-mail ou senha incorretos.");
            }
        } catch(err) { alert("Erro de conexão."); }
        btn.innerText = "ENTRAR"; btn.disabled = false;
    });
}

function liberarAplicativo() {
    document.getElementById('tela-login').classList.add('escondido');
    document.getElementById('app-principal').classList.remove('escondido');
}

function fazerLogout() { localStorage.clear(); location.reload(); }

// ==========================================
// 5. NAVEGAÇÃO
// ==========================================
function abrirAba(idAba) {
    document.querySelectorAll('.tab-painel').forEach(p => p.classList.remove('ativo'));
    document.querySelectorAll('.btn-tab').forEach(b => b.classList.remove('ativa'));
    document.getElementById(idAba).classList.add('ativo');
    event.currentTarget.classList.add('ativa');

    if (idAba === 'tab-ocorrencia' && statusOperacao.kmAberto) {
        document.getElementById('oc-viatura').value = statusOperacao.viatura;
        document.getElementById('oc-condutor').value = statusOperacao.condutor;
        document.getElementById('oc-apoio').value = statusOperacao.apoio;
    }
}

function abrirSubTela(idSub, btn) {
    const p = btn.closest('.tab-painel');
    p.querySelectorAll('.sub-tela').forEach(t => t.classList.remove('ativa'));
    p.querySelectorAll('.btn-subtab').forEach(b => b.classList.remove('ativa'));
    document.getElementById(idSub).classList.add('ativa');
    btn.classList.add('ativa');

    if (idSub === 'sub-km-historico') carregarHistoricoKM();
    if (idSub === 'sub-oc-historico') carregarHistoricoOC();
    if (idSub === 'sub-rel-historico') carregarHistoricoRel();
}

function verificarOutro(sel, idOut) {
    const el = document.getElementById(idOut);
    if (sel.value === 'Outro' || sel.value === 'Outros') {
        el.classList.remove('escondido'); el.setAttribute('required', 'true');
    } else {
        el.classList.add('escondido'); el.removeAttribute('required'); el.value = ''; 
    }
}

// ==========================================
// 6. LÓGICA DO KM
// ==========================================
const formKM = document.getElementById('formKM');
if (formKM) {
    formKM.addEventListener('submit', async function(e) {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        btn.innerText = "Sincronizando..."; btn.disabled = true;

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
        } catch (err) { alert("Erro ao salvar KM."); }
        btn.innerText = "ABRIR KM"; btn.disabled = false;
    });
}

function restaurarTelaKmAberto() {
    document.getElementById('info-vtr-ativa').innerText = `VTR: ${statusOperacao.viatura}`;
    document.getElementById('info-equipe-ativa').innerText = `Equipe: ${statusOperacao.condutor} / ${statusOperacao.apoio}`;
    document.getElementById('info-hora-ativa').innerText = `Aberto às: ${statusOperacao.hora_inicial}`;
    document.getElementById('tela-abrir-km').classList.add('escondido');
    document.getElementById('tela-km-aberto').classList.remove('escondido');
}

function editarKM() {
    document.getElementById('tela-km-aberto').classList.add('escondido');
    document.getElementById('tela-abrir-km').classList.remove('escondido');
}

const formFecharKM = document.getElementById('formFecharKM');
if(formFecharKM) {
    formFecharKM.addEventListener('submit', async function(e) {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        btn.innerText = "Fechando..."; btn.disabled = true;
        try {
            await fetch(`${SUPABASE_URL}/rest/v1/viaturas?id=eq.${statusOperacao.idDb}`, {
                method: 'PATCH', headers: getHeaders(), body: JSON.stringify({
                    km_final: document.getElementById('km-final').value,
                    hora_final: document.getElementById('km-hora-final').value
                })
            });
            localStorage.removeItem('statusVtr');
            location.reload();
        } catch (err) { alert("Erro ao fechar."); }
    });
}

// ==========================================
// 7. OCORRÊNCIAS
// ==========================================
const formOc = document.getElementById('formOcorrencia');
if(formOc) {
    formOc.addEventListener('submit', function(e) {
        e.preventDefault();
        const novaOc = {
            data: document.getElementById('km-data').value,
            viatura: document.getElementById('oc-viatura').value,
            condutor: document.getElementById('oc-condutor').value,
            apoio: document.getElementById('oc-apoio').value,
            codigo: document.getElementById('oc-codigo').value,
            local: document.getElementById('oc-local').value,
            horaInicial: document.getElementById('oc-hora-inicial').value
        };
        ocorrenciasAbertas.push(novaOc);
        localStorage.setItem('ocsAtivas', JSON.stringify(ocorrenciasAbertas));
        limparAutoSaveForm('formOcorrencia');
        document.getElementById('btnVerAbertas').classList.remove('escondido');
        mostrarOcorrenciasAtivas();
    });
}

function mostrarOcorrenciasAtivas() {
    document.getElementById('tela-oc-form').classList.add('escondido');
    document.getElementById('tela-oc-ativas').classList.remove('escondido');
    const container = document.getElementById('lista-ocorrencias-ativas');
    container.innerHTML = ocorrenciasAbertas.map((oc, i) => `
        <div class="status-box">
            <h3>🔵 EM ANDAMENTO: ${oc.codigo}</h3>
            <p>📍 ${oc.local} | ⏰ Início: ${oc.horaInicial}</p>
            <div style="background: rgba(255,255,255,0.15); padding: 15px; border-radius: 8px; margin-top: 15px; text-align: left;">
                <label style="color:white; font-size:11px; font-weight:bold;">OBSERVAÇÕES</label>
                <textarea id="final-obs-${i}" rows="2" style="margin-bottom:12px; background:white; color:#333;" placeholder="Detalhes do ocorrido..."></textarea>
                
                <label style="color:white; font-size:11px; font-weight:bold;">ANEXAR FOTO</label>
                <input type="file" id="final-foto-${i}" accept="image/*" style="background:white; margin-bottom:12px; color:#333; padding:8px;">
                
                <label style="color:white; font-size:11px; font-weight:bold;">HORA FINAL</label>
                <div style="display:flex; gap:5px;">
                    <input type="time" id="final-hora-${i}" style="background:white; color:#333;">
                    <button type="button" onclick="setHoraAtual('final-hora-${i}')" style="background:white; border-radius:8px; border:none; padding:0 10px;">⏱️</button>
                </div>
            </div>
            <button class="btn-acao btn-alerta mt-4" style="box-shadow: 0 4px 10px rgba(0,0,0,0.2);" onclick="fecharOcorrencia(${i})">ENCERRAR E ENVIAR</button>
        </div>
    `).join('');
}

async function fecharOcorrencia(i) {
    const hf = document.getElementById(`final-hora-${i}`).value;
    const obs = document.getElementById(`final-obs-${i}`).value;
    if(!hf) return alert("Informe a hora final.");

    const btn = event.target;
    btn.innerText = "Enviando..."; btn.disabled = true;

    const oc = ocorrenciasAbertas[i];
    let linkFoto = "Sem arquivos";

    try {
        const fotoInput = document.getElementById(`final-foto-${i}`);
        if (fotoInput.files.length > 0) {
            const fileName = `foto_${Date.now()}.jpg`;
            await fetch(`${SUPABASE_URL}/storage/v1/object/fotos/${fileName}`, {
                method: 'POST', headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${localStorage.getItem('supabase_token')}`, 'Content-Type': 'image/jpeg' },
                body: fotoInput.files[0]
            });
            linkFoto = `${SUPABASE_URL}/storage/v1/object/public/fotos/${fileName}`;
        }

        await fetch(`${SUPABASE_URL}/rest/v1/ocorrencias`, {
            method: 'POST', headers: getHeaders(), body: JSON.stringify({
                data: oc.data, viatura: oc.viatura, condutor: oc.condutor, apoio: oc.apoio,
                codigo: oc.codigo, local: oc.local, hora_inicial: oc.horaInicial,
                hora_final: hf, observacao: obs, arquivos: linkFoto
            })
        });

        ocorrenciasAbertas.splice(i, 1);
        localStorage.setItem('ocsAtivas', JSON.stringify(ocorrenciasAbertas));
        location.reload();
    } catch (err) { alert("Erro ao enviar."); btn.disabled = false; }
}

function prepararNovaOcorrencia() {
    document.getElementById('tela-oc-ativas').classList.add('escondido');
    document.getElementById('tela-oc-form').classList.remove('escondido');
    setHoraAtual('oc-hora-inicial');
}

// ==========================================
// 8. RELATÓRIOS E HISTÓRICO
// ==========================================
const formRel = document.getElementById('formRelatorio');
if(formRel) {
    formRel.addEventListener('submit', async function(e) {
        e.preventDefault();
        const btn = e.target.querySelector('button'); btn.innerText = "Enviando..."; btn.disabled = true;
        try {
            await fetch(`${SUPABASE_URL}/rest/v1/relatorios`, {
                method: 'POST', headers: getHeaders(), body: JSON.stringify({
                    data: document.getElementById('km-data').value,
                    agente: statusOperacao.condutor || "Agente",
                    titulo: document.getElementById('rel-titulo').value,
                    relatorio: document.getElementById('rel-texto').value
                })
            });
            alert("Relatório enviado!");
            limparAutoSaveForm('formRelatorio');
        } catch (err) { alert("Erro."); }
        btn.innerText = "ENVIAR RELATÓRIO"; btn.disabled = false;
    });
}

async function carregarHistoricoKM(termo = "") {
    const container = document.querySelector('#sub-km-historico .caixa-historico');
    container.innerHTML = "Buscando...";
    try {
        let url = `${SUPABASE_URL}/rest/v1/viaturas?order=created_at.desc`;
        if (termo) url += `&or=(viatura.ilike.*${termo}*,condutor.ilike.*${termo}*)`;
        else url += `&limit=30`;
        const res = await fetch(url, { headers: getHeaders() });
        const dados = await res.json();
        container.innerHTML = dados.map(item => `
            <div style="background:#fff; border:1px solid #ddd; padding:10px; border-radius:8px; margin-bottom:10px; text-align:left; font-size:13px;">
                <b>📅 ${new Date(item.data).toLocaleDateString('pt-BR')} | VTR: ${item.viatura}</b>
                <p>👤 ${item.condutor} | 🏁 KM: ${item.km_inicial} ⮕ ${item.km_final || '---'}</p>
            </div>
        `).join('');
    } catch (err) { container.innerHTML = "Erro."; }
}

async function carregarHistoricoOC(termo = "") {
    const container = document.querySelector('#sub-oc-historico .caixa-historico');
    container.innerHTML = "Buscando...";
    try {
        let url = `${SUPABASE_URL}/rest/v1/ocorrencias?order=created_at.desc`;
        if (termo) url += `&or=(codigo.ilike.*${termo}*,local.ilike.*${termo}*,observacao.ilike.*${termo}*)`;
        else url += `&limit=30`;
        const res = await fetch(url, { headers: getHeaders() });
        const dados = await res.json();
        container.innerHTML = dados.map(item => `
            <div style="background:#fff; border:1px solid #ddd; padding:10px; border-radius:8px; margin-bottom:10px; text-align:left; font-size:13px;">
                <b style="color:#d32f2f;">🚨 ${item.codigo}</b>
                <p>📍 ${item.local}</p>
                ${item.arquivos !== 'Sem arquivos' ? `<a href="${item.arquivos}" target="_blank" style="color:#5d48e7; display:block; margin-top:5px; font-weight:bold;">🖼️ Ver Foto</a>` : ''}
            </div>
        `).join('');
    } catch (err) { container.innerHTML = "Erro."; }
}

async function carregarHistoricoRel(termo = "") {
    const container = document.querySelector('#sub-rel-historico .caixa-historico');
    container.innerHTML = "Buscando...";
    try {
        let url = `${SUPABASE_URL}/rest/v1/relatorios?order=created_at.desc`;
        if (termo) url += `&or=(titulo.ilike.*${termo}*,relatorio.ilike.*${termo}*)`;
        const res = await fetch(url, { headers: getHeaders() });
        const dados = await res.json();
        container.innerHTML = dados.map(item => `
            <div style="background:#fff; border:1px solid #ddd; padding:10px; border-radius:8px; margin-bottom:10px; text-align:left; font-size:13px;">
                <b>📄 ${item.titulo}</b>
                <p style="color:#666;">${item.relatorio.substring(0, 80)}...</p>
            </div>
        `).join('');
    } catch (err) { container.innerHTML = "Erro."; }
}
