const SUPABASE_URL = "https://fezxlibfvautquxyarhm.supabase.co";
const SUPABASE_KEY = "sb_publishable_e6F8ATGWLAemomRwmxoHGQ_B9REdJoi";

function getHeaders() {
    return { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${localStorage.getItem('supabase_token') || SUPABASE_KEY}` };
}

const listaViaturas = ["AL 1389", "AL 1390", "AL 1391", "AL 1392", "AL 1393", "AL 1394", "AL 1395", "MH 01", "MH 02", "MH 03", "MH 04", "MH 05", "MH 06", "MH 07", "MH 08", "Sem viatura","Outro"];
const listaAgentes = ["DET 02", "DET 03", "DET 06", "DET 07", "DET 08", "DET 10", "DET 12", "DET 17", "DET 18", "DET 20", "DET 22", "DET 35", "DET 41", "DET 44", "DET 46", "DET 47", "DET 49", "DET 52", "DET 54", "DET 55", "DET 59", "DET 61", "DET 62", "DET 65", "DET 67", "DET 68", "DET 74", "DET 75", "DET 86", "DET 89", "DET 90", "Sem viatura", "Outro"];
const listaCodigos = ["1 - Acompanhamento de alunos", "2 - Apoio em obras", "12 - Sinistro de trânsito sem vítima", "13 - Sinistro de trânsito com vítima", "30 - Remoção de veículo", "37 - Blitz", "Outros"];
const listaSetores = ["Setor 1", "Setor 2", "Setor 3", "Setor 4", "Setor 5", "Outros"];

let statusOperacao = JSON.parse(localStorage.getItem('statusVtr')) || { kmAberto: false, idDb: null };
let ocorrenciasAbertas = JSON.parse(localStorage.getItem('ocsAtivas')) || [];

window.onload = function() {
    if (localStorage.getItem('supabase_token')) { liberarAplicativo(); } else { document.getElementById('tela-login').classList.remove('escondido'); }
    popularSelect('km-viatura', listaViaturas); popularSelect('km-condutor', listaAgentes); popularSelect('km-apoio', listaAgentes);
    popularSelect('oc-viatura', listaViaturas); popularSelect('oc-condutor', listaAgentes); popularSelect('oc-apoio', listaAgentes);
    popularSelect('oc-codigo', listaCodigos); popularSelect('oc-local', listaSetores); 
    if (statusOperacao.kmAberto) restaurarTelaKmAberto();
    if (ocorrenciasAbertas.length > 0) mostrarOcorrenciasAtivas();
};

function popularSelect(id, dados) {
    const s = document.getElementById(id); if (!s) return;
    s.innerHTML = '<option value="">Selecionar</option>' + dados.map(i => `<option value="${i}">${i}</option>`).join('');
}

// LÓGICA DE ABRIR OCORRÊNCIA (FIXED)
const formOc = document.getElementById('formOcorrencia');
if(formOc) {
    formOc.addEventListener('submit', function(e) {
        e.preventDefault();
        const novaOc = {
            viatura: document.getElementById('oc-viatura').value,
            condutor: document.getElementById('oc-condutor').value,
            apoio: document.getElementById('oc-apoio').value,
            codigo: document.getElementById('oc-codigo').value,
            local: document.getElementById('oc-local').value,
            horaInicial: document.getElementById('oc-hora-inicial').value,
            data: new Date().toLocaleDateString('en-CA')
        };
        
        if(!novaOc.codigo || !novaOc.local) return alert("Preencha os campos obrigatórios.");
        
        ocorrenciasAbertas.push(novaOc);
        localStorage.setItem('ocsAtivas', JSON.stringify(ocorrenciasAbertas));
        mostrarOcorrenciasAtivas();
    });
}

function mostrarOcorrenciasAtivas() {
    document.getElementById('tela-oc-form').classList.add('escondido');
    document.getElementById('tela-oc-ativas').classList.remove('escondido');
    const container = document.getElementById('lista-ocorrencias-ativas');
    container.innerHTML = ocorrenciasAbertas.map((oc, i) => `
        <div class="status-box">
            <h3>🚨 EM ANDAMENTO: ${oc.codigo}</h3>
            <p>📍 ${oc.local} | ⏰ Início: ${oc.horaInicial}</p>
            <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; margin-top: 15px; text-align: left;">
                <label style="color:white; font-size:11px;">OBSERVAÇÕES / FOTO / HORA FINAL</label>
                <textarea id="final-obs-${i}" rows="2" style="margin-bottom:10px; background:white; color:#333;"></textarea>
                <input type="file" id="final-foto-${i}" style="background:white; margin-bottom:10px; color:#333; padding:5px;">
                <input type="time" id="final-hora-${i}" style="background:white; color:#333;">
            </div>
            <button class="btn-acao btn-alerta mt-2" onclick="fecharOcorrencia(${i})">ENCERRAR OCORRÊNCIA</button>
        </div>
    `).join('');
}

async function fecharOcorrencia(i) {
    const hf = document.getElementById(`final-hora-${i}`).value;
    if(!hf) return alert("Informe a hora final.");
    const btn = event.target; btn.innerText = "Enviando..."; btn.disabled = true;
    const oc = ocorrenciasAbertas[i];
    try {
        await fetch(`${SUPABASE_URL}/rest/v1/ocorrencias`, {
            method: 'POST', headers: getHeaders(), body: JSON.stringify({
                data: oc.data, viatura: oc.viatura, condutor: oc.condutor, apoio: oc.apoio,
                codigo: oc.codigo, local: oc.local, hora_inicial: oc.horaInicial,
                hora_final: hf, observacao: document.getElementById(`final-obs-${i}`).value
            })
        });
        ocorrenciasAbertas.splice(i, 1);
        localStorage.setItem('ocsAtivas', JSON.stringify(ocorrenciasAbertas));
        location.reload();
    } catch (err) { alert("Erro ao enviar."); btn.disabled = false; }
}

// LOGIN E KM (SIMPLIFICADO)
const formKM = document.getElementById('formKM');
if (formKM) {
    formKM.addEventListener('submit', async function(e) {
        e.preventDefault();
        const payload = {
            data: new Date().toLocaleDateString('en-CA'),
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
            const d = await res.json();
            statusOperacao = { kmAberto: true, idDb: d[0].id, ...payload };
            localStorage.setItem('statusVtr', JSON.stringify(statusOperacao));
            restaurarTelaKmAberto();
        } catch (err) { alert("Erro ao abrir KM."); }
    });
}

function restaurarTelaKmAberto() {
    document.getElementById('info-vtr-ativa').innerText = `VTR: ${statusOperacao.viatura}`;
    document.getElementById('info-equipe-ativa').innerText = `Equipe: ${statusOperacao.condutor} / ${statusOperacao.apoio}`;
    document.getElementById('info-hora-ativa').innerText = `Aberto às: ${statusOperacao.hora_inicial}`;
    document.getElementById('tela-abrir-km').classList.add('escondido');
    document.getElementById('tela-km-aberto').classList.remove('escondido');
}

function abrirAba(id) {
    document.querySelectorAll('.tab-painel').forEach(p => p.classList.remove('ativo'));
    document.querySelectorAll('.btn-tab').forEach(b => b.classList.remove('ativa'));
    document.getElementById(id).classList.add('ativo'); event.currentTarget.classList.add('ativa');
}

function liberarAplicativo() { document.getElementById('tela-login').classList.add('escondido'); document.getElementById('app-principal').classList.remove('escondido'); }
function fazerLogout() { localStorage.clear(); location.reload(); }
function prepararNovaOcorrencia() { document.getElementById('tela-oc-ativas').classList.add('escondido'); document.getElementById('tela-oc-form').classList.remove('escondido'); }
