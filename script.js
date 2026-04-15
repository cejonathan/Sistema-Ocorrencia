// ==========================================
// 1. CHAVES DO SUPABASE E SEGURANÇA
// ==========================================
const SUPABASE_URL = "https://fezxlibfvautquxyarhm.supabase.co";
const SUPABASE_KEY = "sb_publishable_e6F8ATGWLAemomRwmxoHGQ_B9REdJoi";

function getHeaders() {
    const token = localStorage.getItem('supabase_token');
    return {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${token ? token : SUPABASE_KEY}`
    };
}

// ==========================================
// 2. BANCO DE DADOS (LISTAS DO APLICATIVO)
// ==========================================
const listaViaturas = ["Sem viatura", "AL 1389", "AL 1390", "AL 1391", "AL 1392", "AL 1393", "AL 1394", "AL 1395", "MH 01", "MH 02", "MH 03", "MH 04", "MH 05", "MH 06", "MH 07", "MH 08", "Outro"];
const listaAgentes = ["DET 02", "DET 03", "DET 06", "DET 07", "DET 08", "DET 10", "DET 12", "DET 17", "DET 18", "DET 20", "DET 22", "DET 35", "DET 41", "DET 44", "DET 46", "DET 47", "DET 49", "DET 52", "DET 54", "DET 55", "DET 59", "DET 61", "DET 62", "DET 65", "DET 67", "DET 68", "DET 74", "DET 75", "DET 86", "DET 89", "DET 90", "Outro"];
const listaCodigos = ["1 - Acompanhamento de alunos", "2 - Apoio em obras", "3 - Apoio em events", "4 - Apoio ao agente de trânsito", "5 - Acompanhamento de veículos (escolta)", "6 - Fiscalização de caminhão", "7 - COI", "8 - Ação educativa", "9 - Autorização de caçamba/caminhão", "10 - Apoio órgão público/EDP/Telefonia", "11 - Monitoramento", "12 - Sinistro de trânsito sem vítima", "13 - Sinistro de trânsito com vítima", "14 - Animais na pista", "15 - Trabalho administrativo", "16 - Transporte interno", "17 - Solicitação de munícipe", "18 - Operação em semáforo", "19 - Fiscalização em circulação", "20 - Apoio a veículo quebrado", "21 - Travessia de alunos", "22 - Apoio a feira livre", "23 - Desvio de trânsito", "24 - Deslocamento ao centro do servidor", "25 - Apoio a eventos religiosos", "26 - Aferição de radar", "27 - Autorizar veículos a passar no vermelho", "28 - Manutenção da VTR", "29 - Obra SAAE", "30 - Remoção de veículo", "31 - Remoção de veículo abandonado", "32 - Apoio a pintura", "33 - Apoio a poda de árvore", "34 - Apoio a troca de poste/Recolha de fios caídos", "35 - Deslocamento para diretoria de trânsito", "36 - Deslocamento para limpar VTR", "37 - Blitz", "38 - Fiscalização em extensão", "39 - Controle de fluxo", "40 - Fiscalização em ponto fixo", "41 - Posturas", "42 - Vistoria", "Outros"];
const listaSetores = ["Setor 1", "Setor 2", "Setor 3", "Setor 4", "Setor 5", "Setor 6", "Setor 7", "Setor 8", "Setor 9", "Setor 10", "Setor 11", "Setor 12", "Setor 13", "Setor 14", "Setor 15", "Outros"];

let statusOperacao = JSON.parse(localStorage.getItem('statusVtr')) || { kmAberto: false, idDb: null };
let ocorrenciasAbertas = JSON.parse(localStorage.getItem('ocsAtivas')) || [];

// ==========================================
// 3. INICIALIZAÇÃO E UTILITÁRIOS
// ==========================================
function popularSelect(idElemento, arrayDados) {
    const select = document.getElementById(idElemento);
    if (!select) return;
    select.innerHTML = '<option value="Selecionar" selected>Selecionar</option>';
    arrayDados.forEach(item => { select.innerHTML += `<option value="${item}">${item}</option>`; });
}

function setHoraAtual(idInput) {
    const agora = new Date();
    const horas = String(agora.getHours()).padStart(2, '0');
    const minutos = String(agora.getMinutes()).padStart(2, '0');
    if(document.getElementById(idInput)) document.getElementById(idInput).value = `${horas}:${minutos}`;
}

window.onload = function() {
    const tokenSalvo = localStorage.getItem('supabase_token');
    if (tokenSalvo) liberarAplicativo();

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

    if (statusOperacao.kmAberto) restaurarTelaKmAberto();
    if (ocorrenciasAbertas.length > 0 && document.getElementById('btnVerAbertas')) {
        document.getElementById('btnVerAbertas').classList.remove('escondido');
    }
};

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
                alert("Erro: " + (data.error_description || "E-mail ou senha incorretos."));
            }
        } catch(err) { alert("Erro de conexão."); }
        btn.innerText = "ENTRAR"; btn.disabled = false;
    });
}

async function renovarSessaoAtiva() {
    const refreshToken = localStorage.getItem('supabase_refresh_token');
    if (!refreshToken) return;
    try {
        const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
            method: 'POST',
            headers: { 'apikey': SUPABASE_KEY, 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken })
        });
        const data = await res.json();
        if (data.access_token) {
            localStorage.setItem('supabase_token', data.access_token);
            localStorage.setItem('supabase_refresh_token', data.refresh_token);
        } else { fazerLogout(); }
    } catch(err) { console.error("Erro renovação"); }
}

if (localStorage.getItem('supabase_token')) {
    renovarSessaoAtiva();
    setInterval(renovarSessaoAtiva, 45 * 60 * 1000);
}

function liberarAplicativo() {
    if(document.getElementById('tela-login')) document.getElementById('tela-login').classList.add('escondido');
    if(document.getElementById('app-principal')) document.getElementById('app-principal').classList.remove('escondido');
}

function fazerLogout() {
    localStorage.removeItem('supabase_token');
    localStorage.removeItem('supabase_refresh_token');
    location.reload();
}

// ==========================================
// 5. NAVEGAÇÃO E REGRAS DE TELA
// ==========================================
function abrirAba(idAba) {
    document.querySelectorAll('.tab-painel').forEach(p => p.classList.remove('ativo'));
    document.querySelectorAll('.btn-tab').forEach(b => b.classList.remove('ativa'));
    document.getElementById(idAba).classList.add('ativo');
    let idx = Array.from(document.querySelectorAll('.tab-painel')).indexOf(document.getElementById(idAba));
    document.querySelectorAll('.btn-tab')[idx].classList.add('ativa');

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
// 6. COMPRESSÃO DE IMAGENS
// ==========================================
function comprimirFoto(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800;
                const scaleSize = MAX_WIDTH / img.width;
                canvas.width = MAX_WIDTH;
                canvas.height = img.height * scaleSize;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', 0.6));
            };
        };
    });
}

// ==========================================
// 7. LÓGICA DO KM (VIATURAS)
// ==========================================
const formKM = document.getElementById('formKM');
if (formKM) {
    formKM.addEventListener('submit', async function(e) {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        btn.innerText = "Sincronizando..."; btn.disabled = true;

        let v = document.getElementById('km-viatura').value === 'Outro' ? document.getElementById('km-viatura-outro').value : document.getElementById('km-viatura').value;
        let c = document.getElementById('km-condutor').value === 'Outro' ? document.getElementById('km-condutor-outro').value : document.getElementById('km-condutor').value;
        let a = document.getElementById('km-apoio').value === 'Outro' ? document.getElementById('km-apoio-outro').value : (document.getElementById('km-apoio').value === 'Selecionar' ? 'Sem apoio' : document.getElementById('km-apoio').value);

        const payload = {
            data: document.getElementById('km-data').value,
            viatura: v, condutor: c, apoio: a,
            km_inicial: document.getElementById('km-inicial').value,
            hora_inicial: document.getElementById('km-hora-inicial').value
        };

        try {
            if (!statusOperacao.idDb) {
                const res = await fetch(`${SUPABASE_URL}/rest/v1/viaturas`, {
                    method: 'POST', headers: { ...getHeaders(), 'Prefer': 'return=representation' }, body: JSON.stringify(payload)
                });
                const dados = await res.json();
                statusOperacao = { kmAberto: true, idDb: dados[0].id, viatura: v, condutor: c, apoio: a, ...payload };
            } else {
                await fetch(`${SUPABASE_URL}/rest/v1/viaturas?id=eq.${statusOperacao.idDb}`, {
                    method: 'PATCH', headers: getHeaders(), body: JSON.stringify(payload)
                });
                statusOperacao = { ...statusOperacao, viatura: v, condutor: c, apoio: a, ...payload };
            }
            localStorage.setItem('statusVtr', JSON.stringify(statusOperacao));
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
            alert("KM Finalizado!");
            localStorage.removeItem('statusVtr');
            location.reload();
        } catch (err) { alert("Erro ao fechar."); }
    });
}

// ==========================================
// 8. LÓGICA DAS OCORRÊNCIAS
// ==========================================
const formOc = document.getElementById('formOcorrencia');
if(formOc) {
    formOc.addEventListener('submit', async function(e) {
        e.preventDefault();
        const btn = document.getElementById('btnEnviarOc');
        btn.innerText = "Processando..."; btn.disabled = true;

        let v = document.getElementById('oc-viatura').value === 'Outro' ? document.getElementById('oc-viatura-outro').value : document.getElementById('oc-viatura').value;
        let c = document.getElementById('oc-condutor').value === 'Outro' ? document.getElementById('oc-condutor-outro').value : document.getElementById('oc-condutor').value;
        let a = document.getElementById('oc-apoio').value === 'Outro' ? document.getElementById('oc-apoio-outro').value : (document.getElementById('oc-apoio').value === 'Selecionar' ? 'Sem apoio' : document.getElementById('oc-apoio').value);
        let co = document.getElementById('oc-codigo').value === 'Outros' ? document.getElementById('oc-codigo-outro').value : document.getElementById('oc-codigo').value;
        let l = document.getElementById('oc-local').value === 'Outros' ? document.getElementById('oc-local-outro').value : document.getElementById('oc-local').value;

        const novaOc = {
            data: document.getElementById('km-data').value,
            viatura: v, condutor: c, apoio: a, codigo: co, local: l,
            horaInicial: document.getElementById('oc-hora-inicial').value,
            observacao: document.getElementById('oc-observacoes').value,
            fotoBase64: null
        };

        if (document.getElementById('oc-foto').files.length > 0) {
            novaOc.fotoBase64 = await comprimirFoto(document.getElementById('oc-foto').files[0]);
        }
        ocorrenciasAbertas.push(novaOc);
        localStorage.setItem('ocsAtivas', JSON.stringify(ocorrenciasAbertas));
        document.getElementById('btnVerAbertas').classList.remove('escondido');
        mostrarOcorrenciasAtivas();
        btn.innerText = "ABRIR OCORRÊNCIA"; btn.disabled = false;
    });
}

function mostrarOcorrenciasAtivas() {
    document.getElementById('tela-oc-form').classList.add('escondido');
    document.getElementById('tela-oc-ativas').classList.remove('escondido');
    const container = document.getElementById('lista-ocorrencias-ativas');
    container.innerHTML = ocorrenciasAbertas.map((oc, i) => `
        <div class="status-box" style="background:#fff3cd; border-left:5px solid #ffc107; text-align:left;">
            <h3 style="color:#856404;">🚨 ${oc.codigo}</h3>
            <p>📍 ${oc.local}</p>
            <div class="campo-grupo mt-2">
                <label>HORA FINAL</label>
                <div style="display:flex; gap:5px;">
                    <input type="time" id="oc-hora-final-${i}">
                    <button type="button" onclick="setHoraAtual('oc-hora-final-${i}')" style="padding:5px;">⏱️</button>
                </div>
            </div>
            <button class="btn-acao btn-alerta mt-2" onclick="fecharOcorrencia(${i})">FECHAR E ENVIAR</button>
        </div>
    `).join('');
}

async function fecharOcorrencia(i) {
    const hf = document.getElementById(`oc-hora-final-${i}`).value;
    if(!hf) return alert("Preencha a hora.");
    const oc = ocorrenciasAbertas[i];
    let linkArquivo = "Sem arquivos";
    try {
        if (oc.fotoBase64) {
            const blob = await fetch(oc.fotoBase64).then(r => r.blob());
            const fileName = `foto_${Date.now()}.jpg`;
            await fetch(`${SUPABASE_URL}/storage/v1/object/fotos/${fileName}`, {
                method: 'POST', headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${localStorage.getItem('supabase_token')}`, 'Content-Type': 'image/jpeg' }, body: blob
            });
            linkArquivo = `${SUPABASE_URL}/storage/v1/object/public/fotos/${fileName}`;
        }
        await fetch(`${SUPABASE_URL}/rest/v1/ocorrencias`, {
            method: 'POST', headers: getHeaders(), body: JSON.stringify({
                data: oc.data, viatura: oc.viatura, condutor: oc.condutor, apoio: oc.apoio,
                codigo: oc.codigo, local: oc.local, hora_inicial: oc.horaInicial, 
                hora_final: hf, observacao: oc.observacao, arquivos: linkArquivo
            })
        });
        ocorrenciasAbertas.splice(i, 1);
        localStorage.setItem('ocsAtivas', JSON.stringify(ocorrenciasAbertas));
        if (ocorrenciasAbertas.length === 0) {
            document.getElementById('btnVerAbertas').classList.add('escondido');
            prepararNovaOcorrencia();
        } else { mostrarOcorrenciasAtivas(); }
    } catch (err) { alert("Erro ao enviar."); }
}

function prepararNovaOcorrencia() {
    document.getElementById('tela-oc-ativas').classList.add('escondido');
    document.getElementById('tela-oc-form').classList.remove('escondido');
    setHoraAtual('oc-hora-inicial');
}

// ==========================================
// 9. LÓGICA DE RELATÓRIOS
// ==========================================
const formRel = document.getElementById('formRelatorio');
if(formRel) {
    formRel.addEventListener('submit', async function(e) {
        e.preventDefault();
        const btn = e.target.querySelector('button');
        btn.innerText = "Enviando..."; btn.disabled = true;
        try {
            await fetch(`${SUPABASE_URL}/rest/v1/relatorios`, {
                method: 'POST', headers: getHeaders(), body: JSON.stringify({
                    data: document.getElementById('km-data').value,
                    agente: localStorage.getItem('agente_logado') || 'Agente', // Ideal salvar no login
                    titulo: document.getElementById('rel-titulo').value,
                    relatorio: document.getElementById('rel-texto').value
                })
            });
            alert("Relatório enviado!");
            e.target.reset();
        } catch (err) { alert("Erro."); }
        btn.innerText = "ENVIAR RELATÓRIO"; btn.disabled = false;
    });
}

// ==========================================
// 10. SINCRONIZAÇÃO DE HISTÓRICOS (BUSCA)
// ==========================================
async function carregarHistoricoKM(termo = "") {
    const container = document.querySelector('#sub-km-historico .caixa-historico');
    container.innerHTML = "Buscando...";
    try {
        let url = `${SUPABASE_URL}/rest/v1/viaturas?order=created_at.desc`;
        if (termo) url += `&or=(viatura.ilike.*${termo}*,condutor.ilike.*${termo}*)`;
        else url += `&limit=30`;
        const res = await fetch(url, { headers: getHeaders() });
        const dados = await res.json();
        container.innerHTML = dados.length ? dados.map(item => `
            <div style="background:#fff; border:1px solid #ddd; padding:10px; border-radius:8px; margin-bottom:10px; text-align:left; font-size:13px;">
                <b>📅 ${new Date(item.data).toLocaleDateString('pt-BR')} | VTR: ${item.viatura}</b>
                <p>👤 ${item.condutor} | 🏁 KM: ${item.km_inicial} ⮕ ${item.km_final || '---'}</p>
            </div>
        `).join('') : "<p>Nada encontrado.</p>";
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
        container.innerHTML = dados.length ? dados.map(item => `
            <div style="background:#fff; border:1px solid #ddd; padding:10px; border-radius:8px; margin-bottom:10px; text-align:left; font-size:13px;">
                <b style="color:#d32f2f;">🚨 ${item.codigo}</b>
                <p>📍 ${item.local}</p>
                ${item.arquivos !== 'Sem arquivos' ? `<a href="${item.arquivos}" target="_blank" style="color:#5d48e7; display:block; margin-top:5px;">🖼️ Ver Foto</a>` : ''}
            </div>
        `).join('') : "<p>Nada encontrado.</p>";
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
        container.innerHTML = dados.length ? dados.map(item => `
            <div style="background:#fff; border:1px solid #ddd; padding:10px; border-radius:8px; margin-bottom:10px; text-align:left; font-size:13px;">
                <b>📄 ${item.titulo}</b>
                <p style="color:#666;">${item.relatorio.substring(0, 80)}...</p>
                <div style="font-size:10px; color:#999; margin-top:5px;">${new Date(item.data).toLocaleDateString('pt-BR')}</div>
            </div>
        `).join('') : "<p>Nada encontrado.</p>";
    } catch (err) { container.innerHTML = "Erro."; }
}
