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
// 2. MOTOR AUTO-SAVE
// ==========================================
function aplicarAutoSave() {
    const elementos = document.querySelectorAll('input, select, textarea');
    elementos.forEach(el => {
        const salvo = localStorage.getItem('auto_' + el.id);
        if (salvo && el.type !== 'password' && el.type !== 'file') { el.value = salvo; }
        el.addEventListener('input', () => { if (el.id) localStorage.setItem('auto_' + el.id, el.value); });
    });
}

function limparAutoSaveForm(formId) {
    const form = document.getElementById(formId);
    if(!form) return;
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
        if(document.getElementById('btnVerAbertas')) document.getElementById('btnVerAbertas').classList.remove('escondido');
        mostrarOcorrenciasAtivas();
    }
    
    atualizarStatusHome();
};

function popularSelect(id, dados) {
    const s = document.getElementById(id); if (!s) return;
    s.innerHTML = '<option value="Selecionar">Selecionar</option>' + dados.map(i => `<option value="${i}">${i}</option>`).join('');
}

function setHoraAtual(id) {
    const agora = new Date();
    if(document.getElementById(id)) {
        document.getElementById(id).value = String(agora.getHours()).padStart(2, '0') + ":" + String(agora.getMinutes()).padStart(2, '0');
    }
}

// ==========================================
// 4. LOGIN E RENOVAÇÃO AUTOMÁTICA (45 MIN)
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
                iniciarRenovacaoToken(); // Liga o motor de 45 minutos
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

// Motor de renovação a cada 45 minutos
function iniciarRenovacaoToken() {
    // Evita duplicar os relógios se o app reiniciar
    if(window.tokenTimer) clearInterval(window.tokenTimer);
    
    window.tokenTimer = setInterval(async () => {
        const refreshToken = localStorage.getItem('supabase_refresh_token');
        if(!refreshToken) return;
        
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
                console.log("Token renovado com sucesso (45 min).");
            }
        } catch(err) { console.error("Erro ao renovar token"); }
    }, 45 * 60 * 1000); // 45 minutos exatos
}

// Se o agente já abrir o app logado, o motor liga sozinho
if (localStorage.getItem('supabase_token')) {
    iniciarRenovacaoToken();
}
// Esta função roda automaticamente toda vez que a página termina de carregar
window.addEventListener('load', () => {
    const token = localStorage.getItem('supabase_token');
    
    // Se o token existe, o usuário já está logado
    if (token) {
        // 1. Garante que a tela de login suma e o app apareça
        const telaLogin = document.getElementById('tela-login');
        const appPrincipal = document.getElementById('app-principal');
        
        if (telaLogin) telaLogin.classList.add('escondido');
        if (appPrincipal) appPrincipal.classList.remove('escondido');

        // 2. CHAMA OS HISTÓRICOS IMEDIATAMENTE
        carregarHistoricoKM();
        carregarHistoricoOC();
        
        // 3. Verifica se tem KM aberto no navegador e restaura a tela
        const statusSalvo = localStorage.getItem('statusVtr');
        if (statusSalvo) {
            statusOperacao = JSON.parse(statusSalvo);
            if (typeof restaurarTelaKmAberto === 'function') restaurarTelaKmAberto();
        }

        // 4. Aplica a trava de identidade (DET) que discutimos
        if (typeof aplicarTravaIdentidade === 'function') aplicarTravaIdentidade();
    }
});


// ==========================================
// 5. NAVEGAÇÃO WHATSAPP & AUTO-LOAD
// ==========================================
function abrirChat(chatId, titulo, subtitulo) {
    document.getElementById('tela-lista-chats').style.display = 'none';
    document.querySelectorAll('.tela-chat').forEach(c => c.classList.remove('ativo'));
    document.getElementById(chatId).classList.add('ativo');
    document.getElementById('btn-voltar-home').style.display = 'block';
    document.getElementById('header-titulo').innerText = titulo;
    document.getElementById('header-sub').innerText = subtitulo;

    if (chatId === 'chat-ocorrencia' && statusOperacao.kmAberto) {
        document.getElementById('oc-viatura').value = statusOperacao.viatura;
        document.getElementById('oc-condutor').value = statusOperacao.condutor;
        document.getElementById('oc-apoio').value = statusOperacao.apoio;
    }

    // CARREGA O HISTÓRICO AUTOMATICAMENTE AO ABRIR A CONVERSA
    if (chatId === 'chat-viatura') carregarHistoricoKM();
    if (chatId === 'chat-ocorrencia') carregarHistoricoOC();
    if (chatId === 'chat-relatorio') carregarHistoricoRel();
}

function voltarParaHome() {
    document.querySelectorAll('.tela-chat').forEach(c => c.classList.remove('ativo'));
    document.getElementById('tela-lista-chats').style.display = 'block';
    document.getElementById('btn-voltar-home').style.display = 'none';
    document.getElementById('header-titulo').innerText = 'Agente Trânsito';
    document.getElementById('header-sub').innerText = 'SISTEMA OPERACIONAL';
}

function atualizarStatusHome() {
    const stVtr = document.getElementById('status-vtr-home');
    if(stVtr) {
        if(statusOperacao.kmAberto) {
            stVtr.innerText = `🟢 VTR ${statusOperacao.viatura} em operação`;
            stVtr.style.color = '#25D366'; stVtr.style.fontWeight = 'bold';
        } else {
            stVtr.innerText = `Toque para abrir KM...`;
            stVtr.style.color = '#667781'; stVtr.style.fontWeight = 'normal';
        }
    }
    const stOc = document.getElementById('status-oc-home');
    if(stOc) {
        if(ocorrenciasAbertas.length > 0) {
            stOc.innerText = `🚨 ${ocorrenciasAbertas.length} ocorrência(s) em andamento`;
            stOc.style.color = '#dc3545'; stOc.style.fontWeight = 'bold';
        } else {
            stOc.innerText = `Toque para registrar nova ocorrência...`;
            stOc.style.color = '#667781'; stOc.style.fontWeight = 'normal';
        }
    }
}

function verificarOutro(sel, idOut) {
    const el = document.getElementById(idOut);
    if (!el) return;
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

        let v = document.getElementById('km-viatura').value;
        v = (v === 'Outro' || v === 'Outros') ? document.getElementById('km-viatura-outro').value : v;
        let c = document.getElementById('km-condutor').value;
        c = (c === 'Outro' || c === 'Outros') ? document.getElementById('km-condutor-outro').value : c;
        let a = document.getElementById('km-apoio').value;
        a = (a === 'Outro' || a === 'Outros') ? document.getElementById('km-apoio-outro').value : a;

        const payload = {
            data: document.getElementById('km-data').value,
            viatura: v, condutor: c, apoio: a,
            km_inicial: document.getElementById('km-inicial').value,
            hora_inicial: document.getElementById('km-hora-inicial').value
        };

        try {
            const res = await fetch(`${SUPABASE_URL}/rest/v1/viaturas`, {
                method: 'POST', headers: { ...getHeaders(), 'Prefer': 'return=representation' }, body: JSON.stringify(payload)
            });
            if(!res.ok) throw new Error("Erro API");
            const dados = await res.json();
            statusOperacao = { kmAberto: true, idDb: (dados && dados[0] ? dados[0].id : Date.now()), ...payload };
            localStorage.setItem('statusVtr', JSON.stringify(statusOperacao));
            limparAutoSaveForm('formKM');
            restaurarTelaKmAberto();
            atualizarStatusHome();
            carregarHistoricoKM(); // Atualiza a lista automaticamente após abrir
        } catch (err) { 
            console.error(err);
            alert("Aviso: O banco demorou a responder, mas o KM foi aberto no seu celular."); 
            statusOperacao = { kmAberto: true, idDb: Date.now(), ...payload };
            localStorage.setItem('statusVtr', JSON.stringify(statusOperacao));
            limparAutoSaveForm('formKM');
            restaurarTelaKmAberto();
            atualizarStatusHome();
        }
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
        } catch (err) { alert("Erro ao fechar."); btn.innerText = "FECHAR KM"; btn.disabled = false; }
    });
}

/// ==========================================
// 7. OCORRÊNCIAS (Numeração Instantânea na Abertura)
// ==========================================
const formOc = document.getElementById('formOcorrencia');
if(formOc) {
    formOc.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Pega o botão de forma segura para não travar o código
        const btn = e.target.querySelector('button[type="submit"]') || document.getElementById('btn-abrir-oc') || e.target.querySelector('button');
        if(btn) { btn.innerText = "RESERVANDO NÚMERO..."; btn.disabled = true; }

        // 1. Coleta os dados dos campos
        let vo = document.getElementById('oc-viatura').value;
        vo = (vo === 'Outro' || vo === 'Outros') ? document.getElementById('oc-viatura-outro').value : vo;
        let co = document.getElementById('oc-condutor').value;
        co = (co === 'Outro' || co === 'Outros') ? document.getElementById('oc-condutor-outro').value : co;
        let ao = document.getElementById('oc-apoio').value;
        ao = (ao === 'Outro' || ao === 'Outros') ? document.getElementById('oc-apoio-outro').value : ao;
        let codo = document.getElementById('oc-codigo').value;
        codo = (codo === 'Outro' || codo === 'Outros') ? document.getElementById('oc-codigo-outro').value : codo;
        let loco = document.getElementById('oc-local').value;
        loco = (loco === 'Outro' || loco === 'Outros') ? document.getElementById('oc-local-outro').value : loco;

        const dataAtual = document.getElementById('km-data') ? document.getElementById('km-data').value : new Date().toLocaleDateString('en-CA');
        const horaIni = document.getElementById('oc-hora-inicial').value;

        try {
            // 2. BUSCA O PRÓXIMO NÚMERO NO SUPABASE
            const anoAtual = new Date().getFullYear();
            let protocoloNovo = `1/${anoAtual}`;
            
            const resBusca = await fetch(`${SUPABASE_URL}/rest/v1/ocorrencias?select=protocolo&protocolo=like.%25/${anoAtual}&order=id.desc&limit=1`, {
                headers: getHeaders()
            });
            
            if (resBusca.ok) {
                const dataBusca = await resBusca.json();
                if (dataBusca.length > 0 && dataBusca[0].protocolo) {
                    const ultimoNumero = parseInt(dataBusca[0].protocolo.split('/')[0]);
                    protocoloNovo = `${ultimoNumero + 1}/${anoAtual}`;
                }
            }

            // 3. SALVA O INÍCIO DA OCORRÊNCIA NO SUPABASE (Apenas com as colunas que você já tem)
            const resInicia = await fetch(`${SUPABASE_URL}/rest/v1/ocorrencias`, {
                method: 'POST', 
                headers: getHeaders(), 
                body: JSON.stringify({
                    protocolo: protocoloNovo,
                    data: dataAtual, viatura: vo, condutor: co, apoio: ao,
                    codigo: codo, local: loco, hora_inicial: horaIni
                })
            });

            if(!resInicia.ok) throw new Error("Erro ao salvar no banco. Verifique as colunas do Supabase.");

            // 4. SALVA NO LOCALSTORAGE PARA CONTINUAR TRABALHANDO
            const novaOc = {
                protocolo: protocoloNovo,
                data: dataAtual, viatura: vo, condutor: co, apoio: ao,
                codigo: codo, local: loco, horaInicial: horaIni
            };
            
            ocorrenciasAbertas.push(novaOc);
            localStorage.setItem('ocsAtivas', JSON.stringify(ocorrenciasAbertas));
            
            limparAutoSaveForm('formOcorrencia');
            document.getElementById('tela-oc-form').classList.add('escondido');
            mostrarOcorrenciasAtivas();
            if(typeof atualizarStatusHome === 'function') atualizarStatusHome();
            
            alert(`Ocorrência ${protocoloNovo} aberta!`);

        } catch (err) { 
            console.error(err);
            alert("Erro ao abrir ocorrência. Verifique sua conexão ou a tabela no banco."); 
        } finally {
            if(btn) { btn.innerText = "ABRIR OCORRÊNCIA"; btn.disabled = false; }
        }
    });
}

function mostrarOcorrenciasAtivas() {
    const telaAtivas = document.getElementById('tela-oc-ativas');
    if(telaAtivas) telaAtivas.classList.remove('escondido');
    
    const container = document.getElementById('lista-ocorrencias-ativas');
    if(!container) return;

    container.innerHTML = ocorrenciasAbertas.map((oc, i) => `
        <div class="status-box">
            <h3>🔵 OCORRÊNCIA: ${oc.protocolo || oc.codigo}</h3>
            <p><strong>TIPO:</strong> ${oc.codigo}</p>
            <p>📍 ${oc.local} | ⏰ Início: ${oc.horaInicial}</p>
            <div style="background: rgba(255,255,255,0.15); padding: 15px; border-radius: 8px; margin-top: 15px; text-align: left;">
                <label style="color:white; font-size:11px; font-weight:bold;">OBSERVAÇÕES</label>
                <textarea id="final-obs-${i}" rows="2" style="margin-bottom:12px; background:white; color:#333; border-radius:8px; border:none; width:100%; padding:8px;" placeholder="Detalhes do ocorrido..."></textarea>
                
                <label style="color:white; font-size:11px; font-weight:bold;">ANEXAR FOTO</label>
                <input type="file" id="final-foto-${i}" accept="image/*" style="background:white; margin-bottom:12px; color:#333; padding:8px; width:100%; border-radius:8px;">
                
                <label style="color:white; font-size:11px; font-weight:bold;">HORA FINAL</label>
                <div style="display:flex; gap:5px;">
                    <input type="time" id="final-hora-${i}" style="background:white; color:#333; border-radius:8px; border:none; padding:8px; flex:1;">
                    <button type="button" onclick="setHoraAtual('final-hora-${i}')" style="background:white; border-radius:8px; border:none; padding:0 15px; font-size:18px;">⏱️</button>
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
    const textoOriginal = btn.innerText;
    btn.innerText = "Atualizando..."; btn.disabled = true;

    const oc = ocorrenciasAbertas[i];
    let linkFoto = "Sem arquivos";

    try {
        const fotoInput = document.getElementById(`final-foto-${i}`);
        if (fotoInput && fotoInput.files.length > 0) {
            const fileName = `foto_${Date.now()}.jpg`;
            await fetch(`${SUPABASE_URL}/storage/v1/object/fotos/${fileName}`, {
                method: 'POST', 
                headers: { 
                    'apikey': SUPABASE_KEY, 
                    'Authorization': `Bearer ${localStorage.getItem('supabase_token')}`, 
                    'Content-Type': 'image/jpeg' 
                },
                body: fotoInput.files[0]
            });
            linkFoto = `${SUPABASE_URL}/storage/v1/object/public/fotos/${fileName}`;
        }

        // ATUALIZA A OCORRÊNCIA NO SUPABASE (Sem a coluna 'finalizada')
        // Usamos encodeURIComponent para evitar que a barra (/) do protocolo quebre o link
        const protocoloCodificado = encodeURIComponent(oc.protocolo);
        const resUpdate = await fetch(`${SUPABASE_URL}/rest/v1/ocorrencias?protocolo=eq.${protocoloCodificado}`, {
            method: 'PATCH', 
            headers: getHeaders(), 
            body: JSON.stringify({
                hora_final: hf,
                observacao: obs,
                arquivos: linkFoto
            })
        });

        if(!resUpdate.ok) throw new Error("Erro ao atualizar banco.");

        ocorrenciasAbertas.splice(i, 1);
        localStorage.setItem('ocsAtivas', JSON.stringify(ocorrenciasAbertas));
        alert(`Ocorrência ${oc.protocolo} finalizada com sucesso!`);
        location.reload();

    } catch (err) { 
        console.error(err);
        alert("Erro ao encerrar. Tente novamente."); 
        btn.disabled = false; btn.innerText = textoOriginal; 
    }
}

function prepararNovaOcorrencia() {
    const telaForm = document.getElementById('tela-oc-form');
    if(telaForm) telaForm.classList.remove('escondido');
    if(typeof setHoraAtual === 'function') setHoraAtual('oc-hora-inicial');
}

// ==========================================
// 8. RELATÓRIOS E PESQUISAS DE HISTÓRICO
// ==========================================
const formRel = document.getElementById('formRelatorio');
if(formRel) {
    formRel.addEventListener('submit', async function(e) {
        e.preventDefault();
        const btn = e.target.querySelector('button'); btn.innerText = "Enviando..."; btn.disabled = true;
        try {
            await fetch(`${SUPABASE_URL}/rest/v1/relatorios`, {
                method: 'POST', headers: getHeaders(), body: JSON.stringify({
                    data: document.getElementById('km-data') ? document.getElementById('km-data').value : new Date().toLocaleDateString('en-CA'),
                    agente: statusOperacao.condutor || "Agente",
                    titulo: document.getElementById('rel-titulo').value,
                    relatorio: document.getElementById('rel-texto').value
                })
            });
            alert("Relatório enviado!");
            limparAutoSaveForm('formRelatorio');
            carregarHistoricoRel(); // Auto-atualiza
        } catch (err) { alert("Erro."); }
        btn.innerText = "➤ ENVIAR RELATÓRIO"; btn.disabled = false;
    });
}

//LÓGICA DO QUE APARECE NO HISTÓRICO DE KM - INICIO

async function carregarHistoricoKM(termo = "") {
    const container = document.getElementById('caixa-hist-km');
    if(!container) return;
    container.innerHTML = "Buscando histórico...";
    try {
        let url = `${SUPABASE_URL}/rest/v1/viaturas?order=created_at.desc`;
        if (termo) url += `&or=(viatura.ilike.*${termo}*,condutor.ilike.*${termo}*)`;
        else url += `&limit=10`; // Traz os últimos 10 automático
        
        const res = await fetch(url, { headers: getHeaders() });
        const dados = await res.json();
        
        container.innerHTML = dados.length ? dados.map(item => `
            <div class="bolha-msg" style="padding:15px; margin-bottom:10px; text-align:left;">
                <b style="font-size:14px; color:#5d48e7; display:block; margin-bottom:8px; border-bottom:1px solid rgba(0,0,0,0.05); padding-bottom:5px;">
                    📅 ${new Date(item.data).toLocaleDateString('pt-BR')} | VTR: ${item.viatura}
                </b>
                <p style="font-size:13px; margin-bottom:5px; color:#333;">
                    👤 <b>Condutor:</b> ${item.condutor}
                </p>
                <p style="font-size:13px; margin-bottom:5px; color:#333;">
                    👥 <b>Apoio:</b> ${item.apoio || 'Nenhum'}
                </p>
                <p style="font-size:13px; margin-bottom:5px; color:#333;">
                    ⏰ <b>Horário:</b> ${item.hora_inicial} ⮕ ${item.hora_final || '<span style="color:#dc3545; font-weight:bold;">Aberto</span>'}
                </p>
                <p style="font-size:13px; margin-bottom:0px; color:#333;">
                    🏁 <b>KM:</b> ${item.km_inicial} ⮕ ${item.km_final || '<span style="color:#dc3545; font-weight:bold;">Aberto</span>'}
                </p>
            </div>
        `).join('') : "<p style='color:#666; font-size:13px; padding:10px;'>Nada encontrado.</p>";
    } catch (err) { 
        container.innerHTML = "<p style='color:red; font-size:13px;'>Erro ao buscar histórico.</p>"; 
    }
}

//LÓGICA DO QUE APARECE NO HISTÓRICO DE KM - FINAL

//LÓGICA DO QUE APARECE NO HISTÓRICO DE OCORRÊNCIAS - INICIO

async function carregarHistoricoOC(termo = "") {
    const container = document.getElementById('caixa-hist-oc');
    if(!container) return;
    container.innerHTML = "Buscando histórico...";
    try {
        let url = `${SUPABASE_URL}/rest/v1/ocorrencias?order=created_at.desc`;
        if (termo) url += `&or=(codigo.ilike.*${termo}*,local.ilike.*${termo}*,observacao.ilike.*${termo}*)`;
        else url += `&limit=10`; // Traz os últimos 10 automático
        
        const res = await fetch(url, { headers: getHeaders() });
        const dados = await res.json();
        
        container.innerHTML = dados.length ? dados.map(item => `
            <div class="bolha-msg" style="padding:15px; margin-bottom:10px; text-align:left;">
                <b style="font-size:14px; color:#d32f2f; display:block; margin-bottom:8px; border-bottom:1px solid rgba(0,0,0,0.05); padding-bottom:5px;">
                    🚨 ${item.protocolo ? `Protocolo ${item.protocolo}` : 'Sem Protocolo'} | ${item.codigo}
                </b>
                <p style="font-size:13px; margin-bottom:5px; color:#333;">
                    📅 <b>Data:</b> ${new Date(item.data).toLocaleDateString('pt-BR')}
                </p>
                <p style="font-size:13px; margin-bottom:5px; color:#333;">
                    📍 <b>Local:</b> ${item.local}
                </p>
                <p style="font-size:13px; margin-bottom:5px; color:#333;">
                    🚓 <b>VTR:</b> ${item.viatura} | 👤 <b>Equipe:</b> ${item.condutor} / ${item.apoio || 'Nenhum'}
                </p>
                <p style="font-size:13px; margin-bottom:5px; color:#333;">
                    ⏰ <b>Horário:</b> ${item.hora_inicial} ⮕ ${item.hora_final || '<span style="color:#d32f2f; font-weight:bold;">Em Andamento</span>'}
                </p>
                
                ${item.observacao ? `
                <div style="background: rgba(0,0,0,0.03); padding:10px; border-radius:8px; margin-top:8px; margin-bottom:8px; border: 1px solid rgba(0,0,0,0.05);">
                    <p style="font-size:12px; color:#444; margin:0;"><b>📝 Obs:</b> ${item.observacao}</p>
                </div>
                ` : ''}
                
                ${item.arquivos !== 'Sem arquivos' && item.arquivos ? `
                <a href="${item.arquivos}" target="_blank" style="color:#5d48e7; display:inline-block; margin-top:8px; font-weight:bold; font-size:13px; text-decoration:none; background:rgba(93, 72, 231, 0.1); padding:8px 15px; border-radius:20px;">
                    🖼️ Ver Foto Anexada
                </a>` : ''}
            </div>
        `).join('') : "<p style='color:#666; font-size:13px; padding:10px;'>Nada encontrado.</p>";
    } catch (err) { 
        container.innerHTML = "<p style='color:red; font-size:13px;'>Erro ao buscar histórico.</p>"; 
    }
}

//LÓGICA DO QUE APARECE NO HISTÓRICO DE OCORRÊNCIAS - FINAL

async function carregarHistoricoRel(termo = "") {
    const container = document.getElementById('caixa-hist-rel');
    if(!container) return;
    container.innerHTML = "Buscando histórico...";
    try {
        let url = `${SUPABASE_URL}/rest/v1/relatorios?order=created_at.desc`;
        if (termo) url += `&or=(titulo.ilike.*${termo}*,relatorio.ilike.*${termo}*)`;
        else url += `&limit=10`; // Traz os últimos 10 automático
        const res = await fetch(url, { headers: getHeaders() });
        const dados = await res.json();
        container.innerHTML = dados.length ? dados.map(item => `
            <div class="bolha-msg" style="padding:10px; margin-bottom:8px;">
                <b style="font-size:13px; color:#5d48e7;">📄 ${item.titulo}</b>
                <p style="color:#666; font-size:12px; margin-top:4px;">${item.relatorio.substring(0, 80)}...</p>
            </div>
        `).join('') : "<p style='color:#666; font-size:13px; padding:10px;'>Nada encontrado.</p>";
    } catch (err) { container.innerHTML = "<p style='color:red; font-size:13px;'>Erro ao buscar histórico.</p>"; }
}
