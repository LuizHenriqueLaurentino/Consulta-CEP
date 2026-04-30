const input     = document.getElementById('cepInput');
const loader    = document.getElementById('loader');
const resultado = document.getElementById('resultado');
const erroBox   = document.getElementById('erro');
const btnBuscar = document.getElementById('btnBuscar');

//Máscara CEP 
input.addEventListener('input', () => {
  let v = input.value.replace(/\D/g, '').slice(0, 8);
  if (v.length > 5) v = v.slice(0, 5) + '-' + v.slice(5);
  input.value = v;
});

//Busca ao pressionar Enter
input.addEventListener('keydown', e => {
  if (e.key === 'Enter') buscarCEP();
});

//Busca ao clicar no botão
btnBuscar.addEventListener('click', buscarCEP);

//Histórico
let hist = JSON.parse(sessionStorage.getItem('hist') || '[]');

function salvarHist(cep, local, uf) {
  hist = hist.filter(h => h.cep !== cep);
  hist.unshift({ cep, local, uf });
  if (hist.length > 5) hist.pop();
  sessionStorage.setItem('hist', JSON.stringify(hist));
  renderHist();
}

function renderHist() {
  const sec = document.getElementById('historico');
  const con = document.getElementById('chips');
  if (!hist.length) { sec.style.display = 'none'; return; }
  sec.style.display = 'block';
  con.innerHTML = hist.map(h =>
    `<button class="chip" onclick="buscarDireto('${h.cep}')">${h.cep} · ${h.local}/${h.uf}</button>`
  ).join('');
}

function buscarDireto(cep) {
  input.value = cep;
  buscarCEP();
}

//Função busca
async function buscarCEP() {
  const raw = input.value.replace(/\D/g, '');

  // Limpar
  erroBox.className = 'error';
  resultado.className = 'card result-card';
  loader.className = 'loader';

  // Validação
  if (raw.length !== 8) {
    erroBox.textContent = ' Digite um CEP válido com 8 dígitos.';
    erroBox.className = 'error show';
    return;
  }

  btnBuscar.disabled = true;
  loader.className = 'loader show';

  try {
    const res = await fetch(`https://viacep.com.br/ws/${raw}/json/`);
    if (!res.ok) throw new Error('Erro na requisição');
    const d = await res.json();

    if (d.erro) {
      erroBox.textContent = 'CEP não encontrado. Verifique e tente novamente.';
      erroBox.className = 'error show';
      return;
    }

    renderResultado(d);
    salvarHist(d.cep, d.localidade, d.uf);

  } catch {
    erroBox.textContent = 'Erro ao conectar à API. Verifique sua conexão.';
    erroBox.className = 'error show';
  } finally {
    loader.className = 'loader';
    btnBuscar.disabled = false;
  }
}

//Renderiza resultado na tela
function val(v) {
  return v?.trim() ? v : '<span class="empty">Não informado</span>';
}

function renderResultado(d) {
  document.getElementById('cepBadge').textContent     = d.cep || '—';
  document.getElementById('rLogradouro').textContent  = d.logradouro || 'Logradouro não informado';
  document.getElementById('rComplemento').textContent = d.complemento || '';

  const linhas = [
    ['Bairro',     d.bairro],
    ['Unidade',    d.unidade],
    ['Localidade', d.localidade],
    ['UF',         d.uf],
    ['Estado',     d.estado],
    ['Região',     d.regiao],
    ['DDD',        d.ddd],
    ['IBGE',       d.ibge],
    ['GIA',        d.gia],
    ['SIAFI',      d.siafi],
  ];

  document.getElementById('tabelaDados').innerHTML = linhas.map(([label, valor]) => `
    <tr><td>${label}</td><td>${val(valor)}</td></tr>
  `).join('');

  resultado.className = 'card result-card show';
  resultado.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ── Inicialização ──
rnderHist();
