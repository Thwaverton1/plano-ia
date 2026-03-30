const PAL = {
  foundation: { c: '#1D9E75', bg: 'rgba(29,158,117,0.15)' },
  tools: { c: '#58a6ff', bg: 'rgba(88,166,255,0.12)' },
  ai: { c: '#d2a8ff', bg: 'rgba(210,168,255,0.15)' },
  advanced: { c: '#f78166', bg: 'rgba(247,129,102,0.12)' },
  career: { c: '#ffa657', bg: 'rgba(255,166,87,0.12)' },
  ops: { c: '#7ee787', bg: 'rgba(126,231,135,0.12)' },
};

function mkNode(id, lbl, ly, palKey, desc, lnks = [], cmds = []) {
  const pal = PAL[palKey] || PAL.tools;
  return {
    id,
    lbl,
    ly,
    c: pal.c,
    bg: pal.bg,
    desc,
    lnks,
    cmds,
  };
}

function mkLink(i, t, u) {
  return { i, t, u };
}

const LINK_CONTENT_FIELDS = ['lnks', 'lessons', 'articles'];
const TEXT_CONTENT_FIELDS = ['cmds', 'practice', 'quickNotes', 'topics', 'projects'];

function dedupeBy(items, keyFn) {
  const seen = new Set();
  return items.filter((item) => {
    const key = keyFn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function applyContentPatch(target, patch) {
  if (!patch) return target;

  LINK_CONTENT_FIELDS.forEach((field) => {
    target[field] = dedupeBy(
      (target[field] || []).concat(patch[field] || []),
      (item) => `${item.u}|${item.t}`
    );
  });

  TEXT_CONTENT_FIELDS.forEach((field) => {
    target[field] = dedupeBy(
      (target[field] || []).concat(patch[field] || []),
      (item) => item
    );
  });

  return target;
}

function mergeNodeContent(node, patch) {
  return applyContentPatch(node, patch);
}

function composeContentPatch(...patches) {
  return patches.reduce((acc, patch) => applyContentPatch(acc, patch), {});
}

function withoutCmds(patch) {
  return { ...patch, cmds: [] };
}

const CORE_NODES = [
  mkNode(
    'root',
    'TRILHA\nCOMPLETA',
    0,
    'foundation',
    'Trilha completa de IA, ML, DevOps e carreira internacional. Siga da esquerda para a direita e expanda para os ramos laterais.'
  ),

  mkNode(
    'math',
    'MATEMÁTICA',
    1,
    'tools',
    'Álgebra linear, cálculo, probabilidade e estatística: linguagem-base de modelos.',
    [
      { i: '▶', t: '3Blue1Brown — Linear Algebra', u: 'https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab' },
      { i: '📖', t: 'Mathematics for Machine Learning', u: 'https://mml-book.github.io/' },
    ]
  ),
  mkNode(
    'linux',
    'LINUX &\nTERMINAL',
    1,
    'career',
    'Shell, processos, permissões, SSH e automação no dia a dia de engenharia.',
    [
      { i: '🌐', t: 'The Missing Semester (MIT)', u: 'https://missing.csail.mit.edu/' },
      { i: '▶', t: 'Linux for Hackers', u: 'https://www.youtube.com/playlist?list=PLIhvC56v63IJIujb5cyE13oLuyORZpdkL' },
    ],
    [
      'ls -la / cd / pwd / mkdir -p',
      'grep -r "padrao" . --include="*.py"',
      'ssh user@server / scp file server:/path',
    ]
  ),
  mkNode(
    'prog',
    'LÓGICA &\nALGORITMOS',
    1,
    'ai',
    'Pensamento computacional, estruturas de decisão e análise de complexidade.',
    [
      { i: '🌐', t: 'CS50 — Harvard', u: 'https://cs50.harvard.edu/x/' },
      { i: '▶', t: 'Algorithms — Abdul Bari', u: 'https://www.youtube.com/c/Abdul-Bari' },
    ]
  ),

  mkNode(
    'python',
    'PYTHON',
    2,
    'tools',
    'Python avançado para dados, APIs, testes e automação.'
  ),
  mkNode(
    'git',
    'GIT &\nGITHUB',
    2,
    'advanced',
    'Versionamento, PR, releases e fluxo de colaboração profissional.'
  ),
  mkNode(
    'sql',
    'SQL &\nDADOS',
    2,
    'ops',
    'Consultas analíticas, modelagem relacional e performance de query.'
  ),
  mkNode(
    'dsa',
    'ESTRUTURAS\nDE DADOS',
    2,
    'ai',
    'Arrays, árvores, grafos, hash maps e padrões para entrevistas técnicas.'
  ),

  mkNode('numpy', 'NUMPY &\nPANDAS', 3, 'tools', 'Manipulação de dados e vetorização para pipelines de ML.'),
  mkNode('stats', 'ESTATÍSTICA\nAPLICADA', 3, 'career', 'Inferência, testes e métricas para tomada de decisão robusta.'),
  mkNode('viz', 'VISUALIZAÇÃO\nDE DADOS', 3, 'ops', 'Storytelling com dados, dashboards e relatórios técnicos.'),

  mkNode('ml', 'MACHINE\nLEARNING', 4, 'foundation', 'Regressão, classificação, clustering, validação e comparação de modelos.'),
  mkNode('feat', 'FEATURE\nENGINEERING', 4, 'advanced', 'Encoding, normalização, seleção de features e prevenção de leakage.'),

  mkNode('dl', 'DEEP\nLEARNING', 5, 'ai', 'Redes neurais profundas, treinamento estável e generalização.'),
  mkNode('pytorch', 'PYTORCH', 5, 'advanced', 'Tensors, autograd, loops de treino e aceleração em GPU.'),

  mkNode('cnn', 'CNNs &\nVISÃO', 6, 'tools', 'Classificação, detecção, segmentação e transfer learning em visão.'),
  mkNode('transf', 'TRANSFORMERS\n& ATTENTION', 6, 'ai', 'Self-attention, arquiteturas encoder/decoder e base de LLMs.'),
  mkNode('rl', 'APRENDIZADO\nPOR REFORÇO', 6, 'ops', 'Policy gradient, PPO e otimização por recompensa.'),

  mkNode('nlp', 'NLP &\nLLMs', 7, 'foundation', 'Embeddings, RAG, agentes e aplicações de linguagem em produção.'),
  mkNode('finetun', 'FINE-TUNING\n& RLHF', 7, 'ai', 'LoRA/QLoRA, DPO, alinhamento e especialização de modelos.'),

  mkNode('mlops', 'MLOPS &\nTRACKING', 8, 'advanced', 'Experiment tracking, registry, monitoramento e governança de modelos.'),
  mkNode('docker', 'DOCKER &\nDEPLOY', 8, 'tools', 'Containerização, serving, orquestração e CI/CD para IA.'),

  mkNode('portf', 'PORTFÓLIO\nGITHUB', 9, 'foundation', 'Projetos reais com documentação forte e evidência de impacto.'),
  mkNode('leet', 'LEETCODE &\nENTREVISTAS', 9, 'career', 'Treino de algoritmos, mock interviews e preparação de system design.'),
  mkNode('mercado', 'MERCADO\nGLOBAL', 9, 'ai', 'Aplicações internacionais, networking, entrevistas em inglês e negociação.'),
];

const CORE_EDGES = [
  ['root', 'math'], ['root', 'linux'], ['root', 'prog'],
  ['math', 'python'], ['math', 'stats'],
  ['linux', 'git'], ['linux', 'docker'],
  ['prog', 'python'], ['prog', 'dsa'],
  ['python', 'numpy'], ['python', 'ml'],
  ['git', 'dsa'], ['git', 'portf'],
  ['sql', 'numpy'], ['sql', 'stats'],
  ['numpy', 'stats'], ['numpy', 'ml'], ['numpy', 'viz'],
  ['stats', 'ml'], ['stats', 'feat'],
  ['viz', 'ml'],
  ['dsa', 'ml'], ['dsa', 'leet'],
  ['ml', 'dl'], ['ml', 'feat'],
  ['feat', 'dl'],
  ['dl', 'pytorch'], ['dl', 'transf'],
  ['pytorch', 'cnn'], ['pytorch', 'transf'], ['pytorch', 'rl'],
  ['cnn', 'nlp'],
  ['transf', 'nlp'], ['transf', 'finetun'],
  ['rl', 'finetun'], ['rl', 'nlp'],
  ['nlp', 'mlops'], ['nlp', 'portf'],
  ['finetun', 'mlops'], ['finetun', 'portf'],
  ['mlops', 'docker'],
  ['docker', 'portf'], ['docker', 'mercado'],
  ['portf', 'mercado'], ['leet', 'mercado'],
];

const EXPANSION_GROUPS = [
  {
    parent: 'math',
    ly: 2,
    pal: 'tools',
    nodes: [
      ['lin_alg', 'ÁLGEBRA\nLINEAR+', 'Vetores, autovalores, SVD e PCA para interpretar transformações em modelos.'],
      ['calculo', 'CÁLCULO\nAPLICADO', 'Derivadas, gradientes e otimização contínua no processo de treino.'],
      ['probabilidade', 'PROBABILIDADE\nBAYESIANA', 'Distribuições, inferência e atualizações de crença em cenários incertos.'],
    ],
  },
  {
    parent: 'linux',
    ly: 2,
    pal: 'career',
    nodes: [
      ['shell_script', 'SHELL\nSCRIPTING', 'Automação de tarefas repetitivas e orquestração local de jobs.'],
      ['tmux_ops', 'TMUX &\nSESSÕES', 'Sessões persistentes para treinos longos e troubleshooting remoto.'],
      ['monitoring_cli', 'MONITORAMENTO\nCLI', 'top/htop/iostat/nvidia-smi para leitura de gargalos em tempo real.'],
    ],
  },
  {
    parent: 'prog',
    ly: 2,
    pal: 'ai',
    nodes: [
      ['complexidade', 'COMPLEXIDADE\nDE TEMPO', 'Análise Big-O para escolher algoritmos viáveis em produção.'],
      ['recursao', 'RECURSÃO &\nDP', 'Top-down/bottom-up para otimizar problemas combinatórios.'],
      ['patterns', 'PADRÕES\nDE PROJETO', 'Organização de código escalável para times e produtos maiores.'],
    ],
  },
  {
    parent: 'python',
    ly: 3,
    pal: 'tools',
    nodes: [
      ['py_oop', 'PYTHON\nOOP', 'Classes, interfaces e composição para sistemas de ML reutilizáveis.'],
      ['py_async', 'PYTHON\nASYNC', 'Concorrência para ingestão de dados, APIs e pipelines assíncronos.'],
      ['py_perf', 'PYTHON\nPERF', 'Profiling e otimizações de CPU/memória para workloads críticos.'],
    ],
  },
  {
    parent: 'git',
    ly: 3,
    pal: 'advanced',
    nodes: [
      ['ci_cd', 'CI/CD\nPIPELINES', 'Validação automática de código, testes e deploy contínuo.'],
      ['release_flow', 'RELEASE\nFLOW', 'Estratégia de versionamento, changelog e rollback seguro.'],
      ['code_review', 'CODE\nREVIEW', 'Padrões de revisão técnica para manter qualidade de engenharia.'],
    ],
  },
  {
    parent: 'sql',
    ly: 3,
    pal: 'ops',
    nodes: [
      ['data_modeling', 'DATA\nMODELING', 'Modelo relacional e consistência entre entidades de negócio.'],
      ['index_tuning', 'INDEX\nTUNING', 'Otimização de consultas e redução de latência analítica.'],
      ['warehouse', 'DATA\nWAREHOUSE', 'Camadas bronze/silver/gold e governança de dados analíticos.'],
    ],
  },
  {
    parent: 'dsa',
    ly: 3,
    pal: 'ai',
    nodes: [
      ['graphs', 'GRAFOS', 'BFS/DFS/Dijkstra para problemas de dependência e busca eficiente.'],
      ['trees', 'ÁRVORES\nBALANCEADAS', 'BST/Heap/Trie para estruturas usadas em entrevistas e sistemas.'],
      ['greedy_dp', 'GREEDY &\nDP', 'Heurísticas e otimização dinâmica para desafios clássicos.'],
    ],
  },
  {
    parent: 'numpy',
    ly: 4,
    pal: 'tools',
    nodes: [
      ['polars', 'POLARS', 'DataFrame columnar rápido para ETL e workloads grandes.'],
      ['spark', 'SPARK', 'Processamento distribuído de dados para escala de produção.'],
      ['feature_store', 'FEATURE\nSTORE', 'Reuso de features online/offline com consistência temporal.'],
    ],
  },
  {
    parent: 'stats',
    ly: 4,
    pal: 'career',
    nodes: [
      ['causal', 'INFERÊNCIA\nCAUSAL', 'Relação causa-efeito para decisões de produto mais confiáveis.'],
      ['ab_testing', 'A/B\nTESTING', 'Desenho experimental e validação de hipóteses em produção.'],
      ['uncertainty', 'INCERTEZA\nCALIBRADA', 'Confiabilidade das previsões além da métrica de acurácia.'],
    ],
  },
  {
    parent: 'ml',
    ly: 5,
    pal: 'foundation',
    nodes: [
      ['recommender', 'SISTEMAS DE\nRECOMENDAÇÃO', 'Ranking e personalização para produtos digitais.'],
      ['timeseries', 'SÉRIES\nTEMPORAIS', 'Previsão, sazonalidade e detecção de mudanças de regime.'],
      ['anomaly', 'ANOMALY\nDETECTION', 'Modelos para fraudes, falhas e desvios operacionais.'],
    ],
  },
  {
    parent: 'feat',
    ly: 5,
    pal: 'advanced',
    nodes: [
      ['data_validation', 'VALIDAÇÃO\nDE DADOS', 'Regras de schema e qualidade antes do treino.'],
      ['imbalanced', 'DADOS\nDESBALANCEADOS', 'Class weights, focal loss e estratégias de reamostragem.'],
      ['leakage', 'LEAKAGE\nGUARD', 'Controles para impedir vazamento de informação no pipeline.'],
    ],
  },
  {
    parent: 'dl',
    ly: 6,
    pal: 'ai',
    nodes: [
      ['self_supervised', 'SELF-\nSUPERVISED', 'Pré-treino sem rótulo e ganho de representação robusta.'],
      ['regularization', 'REGULARIZATION', 'Dropout, weight decay e técnicas anti-overfitting.'],
      ['nn_optimization', 'OTIMIZAÇÃO\nDE REDES', 'Schedulers, clipping e estabilidade em modelos grandes.'],
    ],
  },
  {
    parent: 'pytorch',
    ly: 6,
    pal: 'advanced',
    nodes: [
      ['lightning', 'PYTORCH\nLIGHTNING', 'Treino organizado com abstrações para escala e reuso.'],
      ['dist_train', 'TREINO\nDISTRIBUÍDO', 'DDP/ZeRO/parallelism para múltiplas GPUs e nós.'],
      ['compile_infer', 'COMPILE &\nINFER', 'torch.compile, quantização e otimização de inferência.'],
    ],
  },
  {
    parent: 'cnn',
    ly: 7,
    pal: 'tools',
    nodes: [
      ['obj_detect', 'OBJECT\nDETECTION', 'YOLO e pipelines de detecção para visão em tempo real.'],
      ['segment', 'SEGMENTAÇÃO', 'Máscaras semânticas/instância para percepção detalhada.'],
      ['ocr', 'OCR\nINTELIGENTE', 'Leitura de texto em documentos e ambientes industriais.'],
    ],
  },
  {
    parent: 'transf',
    ly: 7,
    pal: 'ai',
    nodes: [
      ['bert_gpt', 'BERT/GPT\nFAMÍLIAS', 'Diferenças de arquitetura e trade-offs de uso.'],
      ['llm_internals', 'INTERNOS\nDE LLM', 'Tokenização, KV cache, contexto e scaling laws.'],
      ['diffusion', 'DIFFUSION\nMODELS', 'Geração de imagem/áudio e modelos multimodais modernos.'],
    ],
  },
  {
    parent: 'nlp',
    ly: 8,
    pal: 'foundation',
    nodes: [
      ['rag_systems', 'RAG\nSYSTEMS', 'Busca vetorial, rerank e grounding confiável.'],
      ['agents', 'AGENTES\nAUTÔNOMOS', 'Planejamento, ferramentas e execução multi-etapas.'],
      ['llm_eval', 'AVALIAÇÃO\nDE LLMs', 'Benchmarks, rubricas e testes de regressão de respostas.'],
    ],
  },
  {
    parent: 'finetun',
    ly: 8,
    pal: 'ai',
    nodes: [
      ['lora', 'LORA\nSTACK', 'Fine-tuning leve para adaptar modelos com baixo custo.'],
      ['qlora', 'QLORA\n4-BIT', 'Treino eficiente de modelos grandes em GPUs acessíveis.'],
      ['dpo', 'DPO &\nALINHAMENTO', 'Preferência humana sem pipeline RLHF completo.'],
    ],
  },
  {
    parent: 'mlops',
    ly: 9,
    pal: 'advanced',
    nodes: [
      ['registry', 'MODEL\nREGISTRY', 'Versionamento e promoção de modelos entre ambientes.'],
      ['monitoring', 'MODEL\nMONITORING', 'Drift, desempenho e alertas contínuos em produção.'],
      ['governance', 'GOVERNANÇA\nDE IA', 'Auditoria, linhagem de dados e compliance operacional.'],
    ],
  },
  {
    parent: 'docker',
    ly: 9,
    pal: 'tools',
    nodes: [
      ['k8s', 'KUBERNETES', 'Escalonamento de serviços de inferência e jobs de treino.'],
      ['terraform', 'TERRAFORM', 'Infraestrutura como código para ambientes reproduzíveis.'],
      ['gpu_serving', 'GPU\nSERVING', 'vLLM/TGI/Triton para throughput e latência controlados.'],
    ],
  },
  {
    parent: 'portf',
    ly: 10,
    pal: 'foundation',
    nodes: [
      ['open_source', 'OPEN\nSOURCE', 'Contribuições públicas que mostram colaboração técnica real.'],
      ['case_studies', 'CASE\nSTUDIES', 'Projetos com problema, solução, métricas e aprendizados.'],
      ['tech_writing', 'TECH\nWRITING', 'Comunicação técnica clara para recrutadores e times globais.'],
    ],
  },
  {
    parent: 'leet',
    ly: 10,
    pal: 'career',
    nodes: [
      ['system_design', 'SYSTEM\nDESIGN', 'Arquitetura de sistemas escaláveis para entrevistas sênior.'],
      ['mock_interview', 'MOCK\nINTERVIEWS', 'Prática intencional com feedback estruturado.'],
      ['behavioral', 'BEHAVIORAL\nSTORIES', 'Narrativas STAR para rounds culturais e liderança.'],
    ],
  },
  {
    parent: 'mercado',
    ly: 10,
    pal: 'ai',
    nodes: [
      ['cv_english', 'CV EM\nINGLÊS', 'Currículo orientado a impacto, números e senioridade técnica.'],
      ['networking', 'NETWORKING\nGLOBAL', 'Relação contínua com comunidade, founders e recrutadores.'],
      ['negotiation', 'NEGOCIAÇÃO\nSALARIAL', 'Estratégia de proposta, faixa e compensação total.'],
    ],
  },
];

const EXPANSION_CROSS_EDGES = [
  ['lin_alg', 'ml'], ['calculo', 'dl'], ['probabilidade', 'stats'],
  ['shell_script', 'ci_cd'], ['monitoring_cli', 'monitoring'], ['tmux_ops', 'dist_train'],
  ['complexidade', 'dsa'], ['recursao', 'greedy_dp'], ['patterns', 'system_design'],
  ['py_async', 'agents'], ['py_perf', 'gpu_serving'], ['py_oop', 'lightning'],
  ['ci_cd', 'docker'], ['release_flow', 'mercado'], ['code_review', 'open_source'],
  ['data_modeling', 'warehouse'], ['index_tuning', 'feature_store'], ['warehouse', 'mlops'],
  ['graphs', 'recommender'], ['trees', 'anomaly'], ['greedy_dp', 'leet'],
  ['polars', 'feature_store'], ['spark', 'warehouse'], ['feature_store', 'registry'],
  ['causal', 'ab_testing'], ['ab_testing', 'llm_eval'], ['uncertainty', 'monitoring'],
  ['recommender', 'system_design'], ['timeseries', 'anomaly'], ['anomaly', 'monitoring'],
  ['data_validation', 'governance'], ['imbalanced', 'dpo'], ['leakage', 'monitoring'],
  ['self_supervised', 'multimodal'], ['regularization', 'qlora'], ['nn_optimization', 'dist_train'],
  ['lightning', 'registry'], ['dist_train', 'k8s'], ['compile_infer', 'gpu_serving'],
  ['obj_detect', 'gpu_serving'], ['segment', 'multimodal'], ['ocr', 'rag_systems'],
  ['bert_gpt', 'nlp'], ['llm_internals', 'qlora'], ['diffusion', 'multimodal'],
  ['rag_systems', 'llm_eval'], ['agents', 'governance'], ['llm_eval', 'behavioral'],
  ['lora', 'gpu_serving'], ['qlora', 'cost_opt'], ['dpo', 'llm_eval'],
  ['registry', 'open_source'], ['monitoring', 'incident'], ['governance', 'mercado'],
  ['k8s', 'cost_opt'], ['terraform', 'incident'], ['gpu_serving', 'latency_opt'],
  ['open_source', 'networking'], ['case_studies', 'cv_english'], ['tech_writing', 'networking'],
  ['system_design', 'project_ownership'], ['mock_interview', 'cv_english'], ['behavioral', 'negotiation'],
  ['cv_english', 'networking'], ['networking', 'negotiation'], ['negotiation', 'mercado'],
];

const FRONTIER_NODES = [
  mkNode('multimodal', 'MULTIMODAL\nAI', 11, 'ai', 'Modelos que combinam texto, imagem, áudio e vídeo em um mesmo raciocínio.'),
  mkNode('cost_opt', 'COST\nOPT', 11, 'career', 'Otimização de custo por inferência e custo total de propriedade de IA.'),
  mkNode('latency_opt', 'LATÊNCIA\nEXTREMA', 11, 'tools', 'Engenharia de throughput/latência para experiência real-time.'),
  mkNode('incident', 'INCIDENT\nRESPONSE', 11, 'advanced', 'Resposta a incidentes de produção com observabilidade e runbooks.'),
  mkNode('project_ownership', 'OWNERSHIP\nTÉCNICO', 12, 'foundation', 'Liderança de iniciativas fim-a-fim com responsabilidade por resultados.'),
  mkNode('research_loop', 'LOOP DE\nPESQUISA', 12, 'ai', 'Leitura, reprodução e experimentação contínua de papers aplicados.'),
  mkNode('global_impact', 'IMPACTO\nGLOBAL', 13, 'foundation', 'Nível onde técnica, produto e carreira convergem em escala internacional.'),
];

const FRONTIER_EDGES = [
  ['nlp', 'multimodal'], ['transf', 'multimodal'], ['cnn', 'multimodal'],
  ['mlops', 'cost_opt'], ['docker', 'latency_opt'], ['mlops', 'incident'],
  ['mercado', 'project_ownership'], ['open_source', 'research_loop'], ['llm_eval', 'research_loop'],
  ['project_ownership', 'global_impact'], ['research_loop', 'global_impact'],
  ['cost_opt', 'global_impact'], ['latency_opt', 'global_impact'],
];

const ROBOTICS_NODES = [
  mkNode('kin_dyn', 'CINEMÁTICA\n& DINÂMICA', 3, 'tools', 'Frames, transformações SE(3), quaternions, Jacobianos e dinâmica básica para robótica.'),
  mkNode('ros2', 'ROS 2', 4, 'tools', 'Middleware padrão da robótica moderna com nós, tópicos, serviços, actions e ecossistema modular.'),
  mkNode('gazebo', 'GAZEBO /\nISAAC SIM', 4, 'advanced', 'Simulação física, sensores sintéticos e teste seguro antes de hardware real.'),
  mkNode('slam', 'SLAM', 5, 'ops', 'Localização e mapeamento simultâneo com LIDAR, visão e métodos probabilísticos.'),
  mkNode('control', 'CONTROLE\nROBÓTICO', 5, 'foundation', 'PID, controle de trajetória, estabilidade e interação entre software e sistema físico.'),
  mkNode('nav2', 'NAV2 &\nNAVEGAÇÃO', 6, 'tools', 'Planejamento global/local, costmaps e comportamento autônomo sobre ROS 2.'),
  mkNode('moveit2', 'MOVEIT 2', 6, 'advanced', 'Planejamento cinemático e manipulação para braços robóticos e pick-and-place.'),
  mkNode('robot_hw', 'HARDWARE\nROBÓTICO', 7, 'career', 'Integração com sensores, atuadores, Raspberry Pi, microcontroladores e debugging físico.'),
  mkNode('sim2real', 'SIM-TO-\nREAL', 8, 'advanced', 'Transferência robusta da simulação para o robô real com domain randomization e validação.'),
  mkNode('imitation', 'IMITATION\nLEARNING', 8, 'foundation', 'Aprendizado por demonstração, DAgger e pipelines de teleop para robótica.'),
  mkNode('vla', 'VISION-\nLANGUAGE-\nACTION', 9, 'ai', 'Foundation models que unem percepção, linguagem e ação para robôs generalistas.'),
  mkNode('lerobot', 'LEROBOT &\nOPENVLA', 9, 'foundation', 'Ecossistema open-source de datasets, políticas e modelos para robótica moderna.'),
];

const ROBOTICS_EDGES = [
  ['math', 'kin_dyn'], ['lin_alg', 'kin_dyn'], ['calculo', 'kin_dyn'],
  ['linux', 'ros2'], ['python', 'ros2'], ['git', 'ros2'],
  ['kin_dyn', 'control'],
  ['ros2', 'gazebo'], ['ros2', 'slam'], ['ros2', 'nav2'], ['ros2', 'moveit2'], ['ros2', 'robot_hw'],
  ['gazebo', 'slam'], ['gazebo', 'nav2'], ['gazebo', 'moveit2'], ['gazebo', 'sim2real'],
  ['control', 'slam'], ['control', 'nav2'], ['control', 'moveit2'], ['control', 'robot_hw'],
  ['cnn', 'slam'], ['obj_detect', 'robot_hw'], ['segment', 'moveit2'],
  ['rl', 'sim2real'], ['rl', 'robot_hw'],
  ['nav2', 'robot_hw'], ['moveit2', 'robot_hw'], ['slam', 'robot_hw'],
  ['robot_hw', 'sim2real'], ['moveit2', 'imitation'],
  ['imitation', 'sim2real'], ['imitation', 'vla'], ['sim2real', 'lerobot'],
  ['transf', 'vla'], ['agents', 'vla'], ['multimodal', 'vla'],
  ['vla', 'lerobot'], ['lerobot', 'open_source'], ['robot_hw', 'case_studies'],
];

const AGENT_SYSTEMS_NODES = [
  mkNode('agent_tools', 'TOOL USE &\nJSON', 9, 'tools', 'Ferramentas, function calling e saídas estruturadas para agentes acionarem sistemas reais.'),
  mkNode('agent_state', 'ESTADO &\nLANGGRAPH', 9, 'foundation', 'Grafos de estado, checkpoints e loops robustos para agentes com memória operacional.'),
  mkNode('agent_memory', 'MEMÓRIA\nDE AGENTE', 9, 'ops', 'Curto prazo, longo prazo, retrieval e contexto persistente entre etapas e sessões.'),
  mkNode('agent_supervisor', 'SUPERVISOR', 10, 'advanced', 'Coordenação de agentes especializados, regras de despacho e visão global do fluxo.'),
  mkNode('agent_planner', 'PLANNER', 10, 'ai', 'Decomposição de objetivo em plano executável com subtarefas, critérios e ordem.'),
  mkNode('agent_workers', 'WORKER\nAGENTS', 10, 'tools', 'Agentes especialistas em pesquisa, escrita, execução, validação ou integração.'),
  mkNode('agent_handoffs', 'HANDOFFS &\nPROTOCOLOS', 10, 'career', 'Contratos de entrada/saída, contexto compartilhado e passagem limpa entre agentes.'),
  mkNode('agent_hitl', 'HUMAN-IN-\nTHE-LOOP', 11, 'foundation', 'Confirmação humana para decisões sensíveis, aprovações e correções em fluxo.'),
  mkNode('agent_evalops', 'EVALS &\nOBSERVAB.', 11, 'advanced', 'Tracing, regressão, métricas e análise operacional do comportamento dos agentes.'),
  mkNode('agent_safety', 'SAFETY &\nGUARDRAILS', 11, 'advanced', 'Políticas, permissões, limites de ação e contenções para uso seguro em produção.'),
  mkNode('computer_use', 'COMPUTER\nUSE', 11, 'tools', 'Agentes operando browser/desktop, lendo tela e executando tarefas em sistemas sem API.'),
  mkNode('agent_workflows', 'WORKFLOWS\nCOM IA', 12, 'ops', 'Orquestração com n8n/Make, automação híbrida e integração com processos reais da empresa.'),
];

const AGENT_SYSTEMS_EDGES = [
  ['agents', 'agent_tools'], ['agents', 'agent_state'], ['agents', 'agent_memory'],
  ['agents', 'agent_supervisor'], ['agents', 'computer_use'],
  ['rag_systems', 'agent_memory'], ['llm_eval', 'agent_evalops'], ['governance', 'agent_safety'],
  ['monitoring', 'agent_evalops'], ['py_async', 'agent_workers'], ['system_design', 'agent_supervisor'],
  ['multimodal', 'computer_use'], ['ocr', 'computer_use'],
  ['agent_tools', 'agent_state'], ['agent_tools', 'agent_planner'], ['agent_tools', 'computer_use'],
  ['agent_state', 'agent_memory'], ['agent_state', 'agent_supervisor'], ['agent_state', 'agent_hitl'],
  ['agent_memory', 'agent_supervisor'], ['agent_memory', 'agent_workers'],
  ['agent_supervisor', 'agent_planner'], ['agent_supervisor', 'agent_workers'],
  ['agent_supervisor', 'agent_handoffs'], ['agent_supervisor', 'agent_hitl'],
  ['agent_planner', 'agent_workers'], ['agent_workers', 'agent_handoffs'],
  ['agent_handoffs', 'agent_evalops'], ['agent_handoffs', 'agent_workflows'],
  ['agent_hitl', 'agent_safety'], ['agent_hitl', 'computer_use'],
  ['agent_evalops', 'agent_safety'], ['agent_evalops', 'agent_workflows'],
  ['agent_safety', 'computer_use'], ['agent_safety', 'agent_workflows'],
  ['computer_use', 'agent_workflows'], ['agent_workflows', 'open_source'], ['agent_workflows', 'case_studies'],
];

const AUTOMATION_NODES = [
  mkNode('automation_ai', 'AUTOMAÇÃO\nINTELIGENTE', 8, 'ops', 'RPA, integrações, workflows e agentes aplicados a processos reais de negócio e operação.'),
  mkNode('rpa_ai', 'RPA + IA', 9, 'foundation', 'Automação de processos com OCR, validação, decisões assistidas por LLM e execução auditável.'),
  mkNode('api_auto', 'APIs &\nINTEGRAÇÕES', 9, 'tools', 'Consumo e exposição de APIs, autenticação, retries e integração confiável entre sistemas.'),
  mkNode('langchain_stack', 'LANGCHAIN', 9, 'ai', 'LCEL, tools, retrievers e composição de apps/agentes com componentes reutilizáveis.'),
  mkNode('industrial_iiot', 'IIOT &\nINDÚSTRIA', 9, 'ops', 'Fluxos industriais com sensores, mensageria, séries temporais e resposta operacional.'),
  mkNode('browser_auto', 'BROWSER\nAUTOMATION', 10, 'tools', 'Automação de browser para RPA, testes E2E, scraping e execução visual com evidência.'),
  mkNode('fastapi_hooks', 'FASTAPI &\nWEBHOOKS', 10, 'advanced', 'Endpoints, callbacks e contratos para integrar automações com outros sistemas.'),
  mkNode('task_queue', 'CELERY /\nREDIS', 10, 'ops', 'Filas, scheduling, retries e workers assíncronos para automações de longa duração.'),
  mkNode('google_adk', 'GOOGLE\nADK', 10, 'ai', 'Agent Development Kit para construir agentes, tools e sessões em ecossistema Google.'),
  mkNode('n8n_flow', 'N8N', 10, 'ops', 'Orquestração self-hosted com triggers, branches, approvals e integrações de IA.'),
  mkNode('make_flow', 'MAKE', 10, 'career', 'Automação visual SaaS-first para integrar apps, dados e agentes rapidamente.'),
  mkNode('mqtt_iiot', 'MQTT', 10, 'ops', 'Mensageria leve para sensores, eventos e comunicação edge/cloud em processos industriais.'),
  mkNode('node_red_auto', 'NODE-RED', 10, 'ops', 'Fluxos visuais para IIoT, protocolos industriais, dashboards e regras operacionais.'),
  mkNode('playwright_auto', 'PLAYWRIGHT', 11, 'tools', 'Controle robusto de browser moderno com traces, waits e selectors mais estáveis.'),
  mkNode('selenium_auto', 'SELENIUM', 11, 'advanced', 'Automação cross-browser ampla, legados corporativos e compatibilidade com stacks antigos.'),
  mkNode('ts_observability', 'INFLUXDB /\nGRAFANA', 11, 'advanced', 'Séries temporais, dashboards e alertas para automações, sensores e linhas de produção.'),
  mkNode('industrial_workflows', 'WORKFLOWS\nINDUSTRIAIS', 11, 'foundation', 'Arquiteturas fim a fim: sensor -> ingestão -> modelo -> ação -> alerta com governança operacional.'),
];

const AUTOMATION_EDGES = [
  ['agents', 'automation_ai'], ['ocr', 'rpa_ai'], ['py_async', 'api_auto'],
  ['timeseries', 'industrial_iiot'], ['anomaly', 'industrial_iiot'],
  ['agent_tools', 'langchain_stack'], ['agent_memory', 'langchain_stack'],
  ['computer_use', 'browser_auto'], ['agent_workflows', 'n8n_flow'], ['agent_workflows', 'make_flow'],
  ['monitoring', 'ts_observability'], ['docker', 'industrial_workflows'], ['system_design', 'industrial_workflows'],
  ['automation_ai', 'rpa_ai'], ['automation_ai', 'api_auto'], ['automation_ai', 'langchain_stack'], ['automation_ai', 'industrial_iiot'],
  ['rpa_ai', 'browser_auto'], ['rpa_ai', 'n8n_flow'], ['rpa_ai', 'make_flow'], ['rpa_ai', 'fastapi_hooks'],
  ['api_auto', 'fastapi_hooks'], ['api_auto', 'task_queue'], ['api_auto', 'n8n_flow'], ['api_auto', 'make_flow'],
  ['langchain_stack', 'google_adk'], ['langchain_stack', 'agent_state'], ['langchain_stack', 'rag_systems'],
  ['browser_auto', 'playwright_auto'], ['browser_auto', 'selenium_auto'], ['browser_auto', 'n8n_flow'],
  ['fastapi_hooks', 'task_queue'], ['fastapi_hooks', 'google_adk'],
  ['task_queue', 'n8n_flow'], ['task_queue', 'make_flow'], ['task_queue', 'industrial_workflows'],
  ['n8n_flow', 'make_flow'], ['n8n_flow', 'industrial_workflows'], ['make_flow', 'industrial_workflows'],
  ['industrial_iiot', 'mqtt_iiot'], ['industrial_iiot', 'node_red_auto'], ['industrial_iiot', 'ts_observability'], ['industrial_iiot', 'industrial_workflows'],
  ['mqtt_iiot', 'node_red_auto'], ['mqtt_iiot', 'ts_observability'],
  ['node_red_auto', 'industrial_workflows'], ['ts_observability', 'industrial_workflows'],
  ['google_adk', 'agent_supervisor'], ['google_adk', 'agent_workers'],
  ['playwright_auto', 'computer_use'], ['selenium_auto', 'computer_use'],
  ['industrial_workflows', 'case_studies'], ['industrial_workflows', 'open_source'],
];

const CONTENT_PACKS = {
  trail: {
    lnks: [
      mkLink('🧭', 'roadmap.sh — AI Engineer Roadmap', 'https://roadmap.sh/ai-engineer'),
      mkLink('📚', 'OSSU Computer Science', 'https://github.com/ossu/computer-science'),
      mkLink('🧪', 'mlabonne — LLM Course', 'https://github.com/mlabonne/llm-course'),
    ],
    cmds: [
      'trilha = fundamentos -> especializacao -> producao -> mercado',
      'ritmo = 2h foco/dia + 1 entrega/semana',
      'portfolio = projeto + writeup + demo + repo',
    ],
  },
  math: {
    lnks: [
      mkLink('▶', '3Blue1Brown — Essence of Linear Algebra', 'https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab'),
      mkLink('📖', 'Mathematics for Machine Learning', 'https://mml-book.github.io/'),
      mkLink('📘', 'Khan Academy — Calculus & Probability', 'https://www.khanacademy.org/math'),
    ],
    cmds: [
      'grad = d(loss) / d(theta)',
      'A = U @ S @ Vt  # SVD',
      'posterior ∝ likelihood * prior',
    ],
  },
  linux: {
    lnks: [
      mkLink('🌐', 'The Missing Semester', 'https://missing.csail.mit.edu/'),
      mkLink('📄', 'tmux Cheat Sheet', 'https://tmuxcheatsheet.com/'),
      mkLink('📈', 'Brendan Gregg — Linux Performance', 'https://www.brendangregg.com/linuxperf.html'),
    ],
    cmds: [
      'tmux new -s treino && tmux attach -t treino',
      'htop / iostat -xz 1 / nvidia-smi -l 1',
      'find . -name "*.py" | xargs rg "TODO"',
    ],
  },
  algo: {
    lnks: [
      mkLink('🌐', 'NeetCode Roadmap', 'https://neetcode.io/roadmap'),
      mkLink('📘', 'CP-Algorithms', 'https://cp-algorithms.com/'),
      mkLink('🎥', 'VisuAlgo', 'https://visualgo.net/en'),
    ],
    cmds: [
      'queue = deque([start]); visited = {start}',
      'heapq.heappush(heap, (cost, node))',
      'pattern = clarify -> brute force -> optimize -> test',
    ],
  },
  python: {
    lnks: [
      mkLink('📘', 'Python Tutorial', 'https://docs.python.org/3/tutorial/'),
      mkLink('⚙', 'asyncio Documentation', 'https://docs.python.org/3/library/asyncio.html'),
      mkLink('🧪', 'pytest Documentation', 'https://docs.pytest.org/'),
    ],
    cmds: [
      'python -m venv .venv && source .venv/bin/activate',
      'python -m pytest -q',
      'python -m cProfile -s cumtime app.py',
    ],
  },
  git: {
    lnks: [
      mkLink('📖', 'Pro Git Book', 'https://git-scm.com/book/en/v2'),
      mkLink('🌐', 'GitHub Docs', 'https://docs.github.com/'),
      mkLink('🚀', 'GitHub Actions Documentation', 'https://docs.github.com/en/actions'),
    ],
    cmds: [
      'git switch -c feat/nome-curto',
      'git commit -m "feat: descreve a mudanca"',
      'git push -u origin HEAD',
    ],
  },
  sql: {
    lnks: [
      mkLink('🗄', 'PostgreSQL Documentation', 'https://www.postgresql.org/docs/'),
      mkLink('🎓', 'SQLBolt', 'https://sqlbolt.com/'),
      mkLink('🏗', 'dbt Documentation', 'https://docs.getdbt.com/'),
    ],
    cmds: [
      'EXPLAIN ANALYZE SELECT ...',
      'CREATE INDEX idx_nome ON tabela(coluna)',
      'ROW_NUMBER() OVER (PARTITION BY key ORDER BY ts DESC)',
    ],
  },
  data: {
    lnks: [
      mkLink('🔢', 'NumPy User Guide', 'https://numpy.org/doc/stable/user/'),
      mkLink('🐼', 'pandas User Guide', 'https://pandas.pydata.org/docs/user_guide/index.html'),
      mkLink('⚡', 'Polars Documentation', 'https://docs.pola.rs/'),
    ],
    cmds: [
      'df.groupby("col").agg({"y":"mean"})',
      'arr = np.asarray(x, dtype=np.float32)',
      'pl.scan_parquet("data/*.parquet").collect()',
    ],
  },
  stats: {
    lnks: [
      mkLink('📊', 'StatQuest', 'https://www.youtube.com/c/joshstarmer'),
      mkLink('📖', 'Think Stats', 'https://greenteapress.com/thinkstats2/'),
      mkLink('📘', 'Causal Inference for the Brave and True', 'https://matheusfacure.github.io/python-causality-handbook/landing-page.html'),
    ],
    cmds: [
      'scipy.stats.ttest_ind(a, b, equal_var=False)',
      'confidence_interval = mean +- 1.96 * sem',
      'sm.OLS(y, X).fit().summary()',
    ],
  },
  ml: {
    lnks: [
      mkLink('🤖', 'scikit-learn User Guide', 'https://scikit-learn.org/stable/user_guide.html'),
      mkLink('📈', 'XGBoost Documentation', 'https://xgboost.readthedocs.io/'),
      mkLink('🏁', 'Kaggle — Intro to ML', 'https://www.kaggle.com/learn/intro-to-machine-learning'),
    ],
    cmds: [
      'cross_val_score(model, X, y, cv=5)',
      'model.fit(X_train, y_train); preds = model.predict(X_val)',
      'mean_squared_error(y_val, preds, squared=False)',
    ],
  },
  feature: {
    lnks: [
      mkLink('🧼', 'Feature-engine Documentation', 'https://feature-engine.trainindata.com/'),
      mkLink('🧰', 'scikit-learn Preprocessing', 'https://scikit-learn.org/stable/modules/preprocessing.html'),
      mkLink('🔎', 'Cleanlab Docs', 'https://docs.cleanlab.ai/'),
    ],
    cmds: [
      'train_test_split(X, y, stratify=y, random_state=42)',
      'pipeline = make_pipeline(StandardScaler(), model)',
      'mutual_info_classif(X, y)',
    ],
  },
  dl: {
    lnks: [
      mkLink('🚀', 'fast.ai Course', 'https://course.fast.ai/'),
      mkLink('📖', 'Deep Learning Book', 'https://www.deeplearningbook.org/'),
      mkLink('🎥', 'Karpathy — Zero to Hero', 'https://www.youtube.com/playlist?list=PLAqhIrjkxbuWI23v9cThsA9GvCAUhRvKZ'),
    ],
    cmds: [
      'loss.backward(); optimizer.step(); optimizer.zero_grad()',
      'torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)',
      'scheduler.step()  # learning rate schedule',
    ],
  },
  pytorch: {
    lnks: [
      mkLink('🔥', 'PyTorch Tutorials', 'https://pytorch.org/tutorials/'),
      mkLink('⚡', 'Lightning Documentation', 'https://lightning.ai/docs/pytorch/stable/'),
      mkLink('🚄', 'Hugging Face Accelerate', 'https://huggingface.co/docs/accelerate/index'),
    ],
    cmds: [
      'trainer = Trainer(accelerator="gpu", devices=1)',
      'torch.distributed.init_process_group("nccl")',
      'model = torch.compile(model)',
    ],
  },
  vision: {
    lnks: [
      mkLink('👁', 'CS231n', 'http://cs231n.stanford.edu/'),
      mkLink('🎯', 'Ultralytics Documentation', 'https://docs.ultralytics.com/'),
      mkLink('📷', 'OpenCV Docs', 'https://docs.opencv.org/'),
    ],
    cmds: [
      'model = YOLO("yolo11n.pt")',
      'results = model("image.jpg")',
      'img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)',
    ],
  },
  transformers: {
    lnks: [
      mkLink('📄', 'Attention Is All You Need', 'https://arxiv.org/abs/1706.03762'),
      mkLink('🧠', 'The Illustrated Transformer', 'https://jalammar.github.io/illustrated-transformer/'),
      mkLink('🤗', 'Hugging Face NLP Course', 'https://huggingface.co/learn/nlp-course'),
    ],
    cmds: [
      'tokenizer = AutoTokenizer.from_pretrained(model_id)',
      'inputs = tokenizer(text, return_tensors="pt")',
      'outputs = model.generate(**inputs, max_new_tokens=128)',
    ],
  },
  rl: {
    lnks: [
      mkLink('🎮', 'OpenAI Spinning Up', 'https://spinningup.openai.com/'),
      mkLink('🏋', 'Stable-Baselines3 Docs', 'https://stable-baselines3.readthedocs.io/'),
      mkLink('🤗', 'Hugging Face Deep RL Course', 'https://huggingface.co/learn/deep-rl-course'),
    ],
    cmds: [
      'model = PPO("MlpPolicy", env, verbose=1)',
      'model.learn(total_timesteps=100_000)',
      'obs, _ = env.reset(); action, _ = model.predict(obs)',
    ],
  },
  llm: {
    lnks: [
      mkLink('🔎', 'RAG Paper', 'https://arxiv.org/abs/2005.11401'),
      mkLink('🦙', 'LlamaIndex Docs', 'https://docs.llamaindex.ai/'),
      mkLink('🧩', 'LangChain Docs', 'https://python.langchain.com/docs/introduction/'),
    ],
    cmds: [
      'retriever = vectorstore.as_retriever(search_kwargs={"k": 4})',
      'response = chain.invoke({"question": question})',
      'agent.invoke({"input": task})',
    ],
  },
  finetune: {
    lnks: [
      mkLink('🪶', 'PEFT Documentation', 'https://huggingface.co/docs/peft/index'),
      mkLink('🧪', 'TRL Documentation', 'https://huggingface.co/docs/trl/index'),
      mkLink('📄', 'QLoRA Paper', 'https://arxiv.org/abs/2305.14314'),
    ],
    cmds: [
      'config = LoraConfig(r=16, lora_alpha=32, target_modules=["q_proj","v_proj"])',
      'trainer = SFTTrainer(model=model, train_dataset=ds, args=args)',
      'model.push_to_hub("usuario/modelo-ajustado")',
    ],
  },
  mlops: {
    lnks: [
      mkLink('📊', 'MLflow Docs', 'https://mlflow.org/docs/latest/index.html'),
      mkLink('🛰', 'Weights & Biases Docs', 'https://docs.wandb.ai/'),
      mkLink('🚨', 'Evidently Documentation', 'https://docs.evidentlyai.com/'),
    ],
    cmds: [
      'mlflow.log_metric("f1", score)',
      'wandb.init(project="ml-system")',
      'evidently ui --workspace .evidently',
    ],
  },
  infra: {
    lnks: [
      mkLink('🐳', 'Docker Docs', 'https://docs.docker.com/'),
      mkLink('☸', 'Kubernetes Docs', 'https://kubernetes.io/docs/home/'),
      mkLink('🏗', 'Terraform Docs', 'https://developer.hashicorp.com/terraform/docs'),
    ],
    cmds: [
      'docker build -t app:latest .',
      'kubectl apply -f deploy.yaml',
      'terraform init && terraform apply',
    ],
  },
  portfolio: {
    lnks: [
      mkLink('📝', 'Make a README', 'https://www.makeareadme.com/'),
      mkLink('🌍', 'GitHub Pages', 'https://pages.github.com/'),
      mkLink('🤗', 'Hugging Face Hub Docs', 'https://huggingface.co/docs/hub/index'),
    ],
    cmds: [
      'gh repo create nome-projeto --public',
      'git push -u origin main',
      'README = problema -> abordagem -> resultado -> como rodar',
    ],
  },
  interview: {
    lnks: [
      mkLink('🧩', 'NeetCode Practice', 'https://neetcode.io/practice'),
      mkLink('🏗', 'System Design Primer', 'https://github.com/donnemartin/system-design-primer'),
      mkLink('🎤', 'STAR Method Guide', 'https://www.themuse.com/advice/star-interview-method'),
    ],
    cmds: [
      'coding = clarify -> examples -> brute force -> optimize -> test',
      'design = requirements -> API -> data -> scaling -> tradeoffs',
      'STAR = situation -> task -> action -> result',
    ],
  },
  career: {
    lnks: [
      mkLink('💼', 'Levels.fyi', 'https://www.levels.fyi/'),
      mkLink('🌐', 'Remote ML Jobs', 'https://remoteok.com/remote-ai-jobs'),
      mkLink('📄', 'Chip Huyen — What We Look For in ML Candidates', 'https://huyenchip.com/2023/01/24/what-we-look-for-in-ml-candidates.html'),
    ],
    cmds: [
      'resume bullet = impact + metric + stack',
      'outreach = contexto + valor + pedido objetivo',
      'headline = role | domain | stack | outcome',
    ],
  },
  research: {
    lnks: [
      mkLink('📚', 'Papers with Code', 'https://paperswithcode.com/'),
      mkLink('🧾', 'arXiv cs.LG', 'https://arxiv.org/list/cs.LG/recent'),
      mkLink('🧠', "Lil'Log", 'https://lilianweng.github.io/'),
    ],
    cmds: [
      'paper loop = ler -> reproduzir -> ablar -> publicar notas',
      'track = hipotese / dataset / seed / metrica',
      'writeup = problema -> baseline -> ganho -> limites',
    ],
  },
  leadership: {
    lnks: [
      mkLink('📘', 'Staff Engineer', 'https://staffeng.com/'),
      mkLink('🧭', "The Staff Engineer's Path", 'https://www.oreilly.com/library/view/the-staff-engineers/9781098118723/'),
      mkLink('🛠', 'RFCs and Technical Decision Records', 'https://adr.github.io/'),
    ],
    cmds: [
      'spec = contexto -> opcoes -> decisao -> risco -> rollback',
      'ownership = KPI + roadmap + stakeholders + postmortem',
      'impacto = tecnica + produto + negocio + mentoring',
    ],
  },
  robotics_math: {
    lnks: [
      mkLink('📘', 'Modern Robotics', 'https://modernrobotics.northwestern.edu/nu-gm-book-resource/'),
      mkLink('📐', 'Spatial Math Toolbox Concepts', 'https://petercorke.com/toolboxes/robotics-toolbox/'),
      mkLink('🎓', 'Modern Robotics Course', 'https://www.coursera.org/specializations/modernrobotics'),
    ],
    cmds: [],
  },
  robotics_core: {
    lnks: [
      mkLink('🤖', 'ROS 2 Documentation', 'https://docs.ros.org/en/humble/index.html'),
      mkLink('🏗', 'Gazebo Documentation', 'https://gazebosim.org/docs'),
      mkLink('☁', 'The Construct', 'https://www.theconstruct.ai/'),
    ],
    cmds: [
      'source /opt/ros/humble/setup.bash',
      'colcon build --symlink-install',
      'ros2 topic list && ros2 node list',
    ],
  },
  robotics_nav: {
    lnks: [
      mkLink('🗺', 'slam_toolbox', 'https://github.com/SteveMacenski/slam_toolbox'),
      mkLink('🧭', 'Navigation2 Docs', 'https://docs.nav2.org/'),
      mkLink('🦾', 'MoveIt 2 Documentation', 'https://moveit.picknik.ai/main/index.html'),
    ],
    cmds: [
      'ros2 launch slam_toolbox online_async_launch.py',
      'ros2 launch nav2_bringup navigation_launch.py',
      'ros2 launch moveit2_tutorials demo.launch.py',
    ],
  },
  robotics_hw: {
    lnks: [
      mkLink('🍓', 'Raspberry Pi Documentation', 'https://www.raspberrypi.com/documentation/'),
      mkLink('🔌', 'micro-ROS', 'https://micro.ros.org/'),
      mkLink('📷', 'Intel RealSense Docs', 'https://dev.intelrealsense.com/docs'),
    ],
    cmds: [
      'ls /dev/ttyUSB* /dev/ttyACM*',
      'dmesg | tail -n 50',
      'ros2 topic echo /camera/image_raw',
    ],
  },
  robotics_ai: {
    lnks: [
      mkLink('🏋', 'Isaac Lab', 'https://isaac-sim.github.io/IsaacLab/'),
      mkLink('🤝', 'LeRobot', 'https://huggingface.co/lerobot'),
      mkLink('🧠', 'OpenVLA', 'https://openvla.github.io/'),
    ],
    cmds: [],
  },
  agents_core: {
    lnks: [
      mkLink('🧠', 'Anthropic — Building Effective Agents', 'https://www.anthropic.com/engineering/building-effective-agents'),
      mkLink('🕸', 'LangGraph Documentation', 'https://langchain-ai.github.io/langgraph/'),
      mkLink('🧩', 'Model Context Protocol', 'https://modelcontextprotocol.io/introduction'),
    ],
    lessons: [
      mkLink('🎓', 'LangChain Academy — LangChain Essentials (Python)', 'https://academy.langchain.com/courses/langchain-essentials-python'),
      mkLink('🎓', 'LangChain Academy — LangGraph Essentials (Python)', 'https://academy.langchain.com/courses/langgraph-essentials-python'),
      mkLink('📚', 'LangChain Academy — Quickstart Collection', 'https://academy.langchain.com/collections/quickstart'),
    ],
    cmds: [
      'llm_with_tools = model.bind_tools(tools)',
      'graph = StateGraph(AgentState)',
      'result = graph.invoke({"messages": messages, "task": task})',
    ],
  },
  agents_arch: {
    lnks: [
      mkLink('👥', 'CrewAI Documentation', 'https://docs.crewai.com/'),
      mkLink('🛠', 'AutoGen Documentation', 'https://microsoft.github.io/autogen/stable/'),
      mkLink('🗺', 'LangGraph Multi-Agent Concepts', 'https://langchain-ai.github.io/langgraph/concepts/multi_agent/'),
    ],
    lessons: [
      mkLink('🎓', 'LangChain Academy — Deep Agents with LangGraph', 'https://academy.langchain.com/courses/deep-agents-with-langgraph/'),
      mkLink('🎓', 'LangChain Academy — Deep Research with LangGraph', 'https://academy.langchain.com/courses/deep-research-with-langgraph'),
      mkLink('🎓', 'LangChain Academy — Building Ambient Agents with LangGraph', 'https://academy.langchain.com/courses/ambient-agents'),
    ],
    cmds: [
      'plan = planner.invoke({"goal": goal})',
      'handoff = {"role": "researcher", "context": state, "done": false}',
      'supervisor = route(next_task, capabilities, policy)',
    ],
  },
  agents_reliability: {
    lnks: [
      mkLink('📊', 'LangSmith Documentation', 'https://docs.langchain.com/langsmith/home'),
      mkLink('🔍', 'Langfuse Documentation', 'https://langfuse.com/docs'),
      mkLink('🛡', 'Guardrails AI Docs', 'https://www.guardrailsai.com/docs'),
    ],
    lessons: [
      mkLink('🎓', 'LangChain Academy — LangSmith Essentials', 'https://academy.langchain.com/courses/quickstart-langsmith-essentials'),
      mkLink('🎓', 'LangChain Academy — Building Reliable Agents', 'https://academy.langchain.com/courses/building-reliable-agents'),
      mkLink('📚', 'LangChain Academy — Foundation Collection', 'https://academy.langchain.com/collections/foundation'),
    ],
    cmds: [
      'trace = client.trace(name="agent-run", metadata=run_meta)',
      'decision = require_human_approval(action) if risk > threshold else "auto"',
      'verdict = evaluate(run_output, rubric, expected_output)',
    ],
  },
  agents_automation: {
    lnks: [
      mkLink('🎭', 'Playwright Documentation', 'https://playwright.dev/docs/intro'),
      mkLink('🔗', 'n8n Documentation', 'https://docs.n8n.io/'),
      mkLink('🖱', 'browser-use', 'https://github.com/browser-use/browser-use'),
    ],
    lessons: [
      mkLink('🎓', 'n8n — Build an AI Chat Agent Tutorial', 'https://docs.n8n.io/advanced-ai/intro-tutorial/'),
      mkLink('🎓', 'Make Help — Make AI Agents App', 'https://help.make.com/make-ai-agents-app'),
      mkLink('🎥', 'Microsoft Learn — Getting Started With Playwright', 'https://learn.microsoft.com/en-us/shows/getting-started-with-end-to-end-testing-with-playwright/'),
    ],
    cmds: [
      'playwright codegen https://app.exemplo.com',
      'page.locator("[data-test=export]").click()',
      'n8n start',
    ],
  },
  automation_core: {
    lnks: [
      mkLink('🤖', 'Robocorp Documentation', 'https://robocorp.com/docs'),
      mkLink('🏢', 'UiPath Documentation', 'https://docs.uipath.com/'),
      mkLink('⌨', 'PyAutoGUI Documentation', 'https://pyautogui.readthedocs.io/en/latest/'),
    ],
    lessons: [
      mkLink('🎓', 'UiPath Academy — Automation Explorer', 'https://academy.uipath.com/learning-plans/automation-explorer'),
      mkLink('🎓', 'UiPath Academy — Automation Explorer With Studio Web', 'https://academy.uipath.com/learning-plans/automation-explorer-with-uipath-studio-web'),
      mkLink('🎓', 'Robocorp — Browser and Web Automation', 'https://robocorp.com/portal/tutorial/browser-and-web-automation'),
    ],
    cmds: [
      'processo = trigger -> leitura -> decisão -> ação -> verificação -> log',
      'retry = timeout + screenshot + fallback + alerta',
      'roi = tempo poupado + erro evitado + throughput',
    ],
  },
  automation_api: {
    lnks: [
      mkLink('⚡', 'FastAPI Documentation', 'https://fastapi.tiangolo.com/'),
      mkLink('📮', 'Celery Documentation', 'https://docs.celeryq.dev/en/stable/'),
      mkLink('🧠', 'Redis Documentation', 'https://redis.io/docs/latest/'),
    ],
    lessons: [
      mkLink('🎓', 'FastAPI Tutorial', 'https://fastapi.tiangolo.com/tutorial/'),
      mkLink('🎓', 'Redis University — Node.js Crash Course', 'https://redis.io/learn/develop/node/nodecrashcourse/welcome'),
      mkLink('🎓', 'Redis Learn — Getting Started With Node and Redis', 'https://redis.io/learn/develop/node/gettingstarted'),
    ],
    cmds: [
      'uvicorn app:app --reload',
      'curl -X POST http://localhost:8000/webhooks/event',
      'celery -A worker.app worker -l info',
    ],
  },
  automation_frameworks: {
    lnks: [
      mkLink('🦜', 'LangChain Documentation', 'https://python.langchain.com/docs/introduction/'),
      mkLink('🕸', 'LangGraph Documentation', 'https://langchain-ai.github.io/langgraph/'),
      mkLink('🧭', 'Google ADK Docs', 'https://google.github.io/adk-docs/'),
    ],
    lessons: [
      mkLink('🎓', 'LangChain Academy — LangChain Essentials (Python)', 'https://academy.langchain.com/courses/langchain-essentials-python'),
      mkLink('🎓', 'LangChain Academy — LangGraph Essentials (Python)', 'https://academy.langchain.com/courses/langgraph-essentials-python'),
      mkLink('🎓', 'Google ADK — Get Started', 'https://google.github.io/adk-docs/get-started/'),
    ],
    cmds: [
      'chain = prompt | model | parser',
      'graph = StateGraph(AgentState).compile()',
      'agent = create_agent(model=model, tools=tools)',
    ],
  },
  automation_workflows: {
    lnks: [
      mkLink('🔗', 'n8n Documentation', 'https://docs.n8n.io/'),
      mkLink('🧩', 'n8n AI Nodes', 'https://docs.n8n.io/advanced-ai/'),
      mkLink('⚙', 'Make Help Center', 'https://www.make.com/en/help/home'),
    ],
    lessons: [
      mkLink('🎓', 'n8n Video Courses', 'https://docs.n8n.io/video-courses/'),
      mkLink('🎓', 'n8n — Build an AI Chat Agent Tutorial', 'https://docs.n8n.io/advanced-ai/intro-tutorial/'),
      mkLink('🎓', 'Make Help — Meet the New Make AI Agents App', 'https://help.make.com/meet-the-new-make-ai-agents-app'),
    ],
    cmds: [
      'n8n start',
      'docker compose up -d n8n',
      'fluxo = webhook -> enrich -> aprovação -> ERP',
    ],
  },
  automation_browser: {
    lnks: [
      mkLink('🎭', 'Playwright Documentation', 'https://playwright.dev/docs/intro'),
      mkLink('🌐', 'Selenium Documentation', 'https://www.selenium.dev/documentation/'),
      mkLink('🖱', 'browser-use', 'https://github.com/browser-use/browser-use'),
    ],
    lessons: [
      mkLink('🎥', 'Microsoft Learn — Getting Started With Playwright', 'https://learn.microsoft.com/en-us/shows/getting-started-with-end-to-end-testing-with-playwright/'),
      mkLink('🎓', 'Microsoft Learn — Build With Playwright', 'https://learn.microsoft.com/en-us/training/modules/build-with-playwright/'),
      mkLink('🎓', 'Test Automation University — Selenium WebDriver With Java', 'https://testautomationu.applitools.com/selenium-webdriver-tutorial-java/'),
    ],
    cmds: [
      'playwright codegen https://app.exemplo.com',
      'page.locator("[data-test=submit]").click()',
      'driver.find_element(By.CSS_SELECTOR, "[data-test=submit]").click()',
    ],
  },
  automation_industrial: {
    lnks: [
      mkLink('📡', 'MQTT.org', 'https://mqtt.org/'),
      mkLink('🔌', 'Node-RED Documentation', 'https://nodered.org/docs/'),
      mkLink('📈', 'InfluxDB Documentation', 'https://docs.influxdata.com/'),
      mkLink('📊', 'Grafana Documentation', 'https://grafana.com/docs/'),
    ],
    lessons: [
      mkLink('🎓', 'Node-RED — Creating Your First Flow', 'https://nodered.org/docs/tutorials/first-flow'),
      mkLink('🎓', 'FlowFuse — Node-RED Getting Started', 'https://flowfuse.com/node-red/getting-started/'),
      mkLink('🎓', 'HiveMQ — MQTT Essentials', 'https://www.hivemq.com/downloads/hivemq-ebook-mqtt-essentials.pdf'),
      mkLink('🎓', 'Grafana Labs — Grafana Fundamentals', 'https://grafana.com/tutorials/grafana-fundamentals/'),
    ],
    cmds: [
      'mosquitto_pub -h localhost -t planta/linha01/temp -m "21.4"',
      'docker compose up -d influxdb grafana',
      'node-red',
    ],
  },
};

const CONTENT_ENHANCEMENTS = {
  trail: {
    topics: [
      'Fundamentos -> dados -> modelos -> producao -> mercado',
      'Aprendizado guiado por entregas publicas',
      'Evolucao de estudante para engenheiro de IA',
    ],
    quickNotes: [
      'Consistencia diaria vence estudo caotico.',
      'Cada etapa da trilha precisa virar artefato publico.',
    ],
    practice: [
      'Fechar um ciclo quinzenal com estudo, pratica e documentacao.',
      'Revisar a trilha mensalmente e ajustar gargalos reais.',
    ],
    projects: [
      'Montar um painel pessoal de progresso da trilha.',
      'Criar um hub publico com links para demos, repos e writeups.',
    ],
  },
  math: {
    topics: [
      'Algebra linear aplicada a embeddings e transformacoes',
      'Gradientes, otimizacao e superfícies de perda',
      'Probabilidade e inferencia para incerteza em modelos',
    ],
    quickNotes: [
      'Backpropagation e algebra linear, nao so codigo.',
      'Distribuicoes ajudam a explicar erro, ruido e confianca.',
    ],
    practice: [
      'Implementar gradiente descendente em notebook sem framework.',
      'Resolver PCA ou regressao linear do zero com NumPy.',
    ],
    projects: [
      'Notebook visualizando gradiente, learning rate e convergencia.',
      'Mini biblioteca de PCA/SVD com comparacao contra sklearn.',
    ],
    articles: [
      mkLink('📰', 'The Matrix Calculus You Need For Deep Learning', 'https://explained.ai/matrix-calculus/'),
    ],
  },
  linux: {
    topics: [
      'Processos, sessoes, sinais e jobs longos',
      'Observabilidade local via CLI',
      'Automacao de rotinas com shell',
    ],
    quickNotes: [
      'Ambiente estavel economiza tempo de depuracao.',
      'Treino longo sem tmux ou logs e um risco operacional.',
    ],
    practice: [
      'Subir um treino em tmux e acompanhar logs em tempo real.',
      'Escrever script para bootstrap de ambiente de ML local.',
    ],
    projects: [
      'Criar toolkit shell para setup de experimentos.',
      'Montar cheat sheet de observabilidade para GPU/CPU/disco.',
    ],
  },
  algo: {
    topics: [
      'BFS/DFS, heaps, grafos e arvores',
      'Recursao, backtracking e programacao dinamica',
      'Analise de complexidade e tradeoffs',
    ],
    quickNotes: [
      'Padrao de resolucao importa mais que decorar resposta.',
      'Explique o por que da estrutura, nao so o codigo final.',
    ],
    practice: [
      'Resolver 3 problemas por padrao antes de trocar de tema.',
      'Refazer problemas antigos sem consultar a solucao.',
    ],
    projects: [
      'Repositorio com solucoes comentadas por padrao de problema.',
      'Visualizador simples de busca em grafos e filas de prioridade.',
    ],
  },
  python: {
    topics: [
      'Tipos, iteradores, OOP e composicao',
      'Concorrencia com async IO',
      'Testes, profiling e manutencao de codigo',
    ],
    quickNotes: [
      'Python limpo escala melhor em projetos de IA do que notebooks soltos.',
      'Profiling evita otimizar gargalos imaginarios.',
    ],
    practice: [
      'Refatorar script em pacote com testes e CLI.',
      'Criar pequeno coletor assincrono de dados/APIs.',
    ],
    projects: [
      'CLI para ETL de datasets com validacao e logs.',
      'Servico async para ingestao de dados em lote.',
    ],
  },
  git: {
    topics: [
      'Branches, PRs e fluxo de release',
      'CI/CD e checks obrigatorios',
      'Code review e historico legivel',
    ],
    quickNotes: [
      'Historico bom reduz custo de colaboracao.',
      'Toda release precisa ter rollback claro.',
    ],
    practice: [
      'Criar branch curta e abrir PR com contexto claro.',
      'Automatizar lint/testes antes de merge.',
    ],
    projects: [
      'Template de repositorio com Actions e convencoes de commit.',
      'Pipeline simples de release com changelog automatico.',
    ],
  },
  sql: {
    topics: [
      'Modelagem relacional e chaves',
      'Performance de consultas e indices',
      'Camadas analiticas e data warehouse',
    ],
    quickNotes: [
      'Query lenta quase sempre e problema de plano ou modelagem.',
      'Janela analitica vale muito em entrevistas e analise real.',
    ],
    practice: [
      'Escrever consultas com CTE, window functions e explain.',
      'Modelar tabela fato/dimensao para um caso de negocio.',
    ],
    projects: [
      'Dashboard de coorte/retencao alimentado por SQL.',
      'Mini warehouse com camadas bronze, silver e gold.',
    ],
  },
  data: {
    topics: [
      'Transformacoes vetorizadas e joins',
      'Qualidade, schema e reproducibilidade',
      'ETL para dados tabulares em escala',
    ],
    quickNotes: [
      'Dados limpos e versionados valem mais que pipeline esperta.',
      'Vetorizacao e formato de arquivo definem muita performance.',
    ],
    practice: [
      'Reproduzir um pipeline inteiro a partir de arquivos crus.',
      'Comparar pandas, Polars e parquet em uma mesma carga.',
    ],
    projects: [
      'Pipeline de ingestao tabular com validacao e metricas.',
      'Benchmark de formatos e bibliotecas de DataFrame.',
    ],
  },
  stats: {
    topics: [
      'Inferencia, estimacao e intervalos',
      'Experimentos e causalidade',
      'Calibracao e comunicacao de incerteza',
    ],
    quickNotes: [
      'Metricas sem nocao de variancia induzem decisoes ruins.',
      'Correlacao ajuda, mas causalidade decide produto.',
    ],
    practice: [
      'Rodar A/B testing completo com hipotese e analise.',
      'Comparar metricas de calibracao em modelo de classificacao.',
    ],
    projects: [
      'Notebook de experimento A/B com simulacao e analise.',
      'Painel de confianca e incerteza para previsoes.',
    ],
    articles: [
      mkLink('📰', 'Causal Inference for the Brave and True', 'https://matheusfacure.github.io/python-causality-handbook/landing-page.html'),
    ],
  },
  ml: {
    topics: [
      'Modelos baseline, tuning e validacao',
      'Sistemas de recomendacao e series temporais',
      'Deteccao de anomalias e metricas corretas',
    ],
    quickNotes: [
      'Baseline forte antes de modelo sofisticado.',
      'Escolha de metrica muda a solucao mais que o algoritmo.',
    ],
    practice: [
      'Comparar baseline linear, arvore e boosting no mesmo dataset.',
      'Resolver um problema de ranking ou forecasting real.',
    ],
    projects: [
      'Sistema de recomendacao com avaliacao offline.',
      'Pipeline de deteccao de anomalias com alertas.',
    ],
    articles: [
      mkLink('📰', 'XGBoost: A Scalable Tree Boosting System', 'https://arxiv.org/abs/1603.02754'),
    ],
  },
  feature: {
    topics: [
      'Normalizacao, encoding e leakage',
      'Qualidade de rotulos e desbalanceamento',
      'Features temporais e reuso em producao',
    ],
    quickNotes: [
      'Feature engineering ruim derruba qualquer modelo.',
      'Leakage mascara metricas e destrói deploy.',
    ],
    practice: [
      'Criar pipeline com validacao temporal e sem leakage.',
      'Testar estrategias para dados desbalanceados.',
    ],
    projects: [
      'Feature store simples com versao offline/online.',
      'Relatorio de leakage e qualidade de dados de treino.',
    ],
  },
  dl: {
    topics: [
      'Treinamento, regularizacao e generalizacao',
      'Self-supervised learning e representacoes',
      'Estabilidade de redes profundas',
    ],
    quickNotes: [
      'Overfitting costuma ser problema de dados, regularizacao e objetivo.',
      'Curva de treino sem diagnostico nao ensina nada.',
    ],
    practice: [
      'Treinar um modelo com e sem regularizacao e comparar.',
      'Executar ablation study curta mudando loss, LR e augment.',
    ],
    projects: [
      'Classificador de imagens com comparativo de tecnicas de regularizacao.',
      'Notebook de self-supervised learning em dataset pequeno.',
    ],
    articles: [
      mkLink('📰', 'Dropout: A Simple Way to Prevent Neural Networks from Overfitting', 'https://jmlr.org/papers/v15/srivastava14a.html'),
      mkLink('📰', 'Batch Normalization', 'https://arxiv.org/abs/1502.03167'),
    ],
  },
  pytorch: {
    topics: [
      'Autograd, datasets e loops de treino',
      'Distributed training e aceleracao',
      'Compilacao e inferencia otimizada',
    ],
    quickNotes: [
      'Loop bem instrumentado acelera iteracao mais que trocar arquitetura.',
      'Mixed precision e compile afetam custo e latencia.',
    ],
    practice: [
      'Montar treino completo com checkpoints e metricas.',
      'Comparar throughput com e sem torch.compile.',
    ],
    projects: [
      'Template PyTorch com train/val/test, config e logs.',
      'Benchmark de inferencia com modelos compilados.',
    ],
  },
  vision: {
    topics: [
      'Classificacao, deteccao e segmentacao',
      'Transfer learning e augmentacao',
      'OCR e pipelines de documentos',
    ],
    quickNotes: [
      'Metrica de visao depende da tarefa: accuracy, mAP, IoU.',
      'Qualidade e diversidade do dataset mandam no resultado.',
    ],
    practice: [
      'Treinar classificador e detector no mesmo dominio visual.',
      'Comparar segmentacao com e sem augmentacao agressiva.',
    ],
    projects: [
      'Detector de objetos para ambiente industrial ou urbano.',
      'OCR pipeline para documentos com pos-processamento.',
    ],
    articles: [
      mkLink('📰', 'Deep Residual Learning for Image Recognition', 'https://arxiv.org/abs/1512.03385'),
      mkLink('📰', 'U-Net: Convolutional Networks for Biomedical Image Segmentation', 'https://arxiv.org/abs/1505.04597'),
    ],
  },
  transformers: {
    topics: [
      'Attention, contexto e tokenizacao',
      'Familias BERT/GPT e multimodalidade',
      'Scaling laws e engenharia interna de LLMs',
    ],
    quickNotes: [
      'Attention domina arquitetura moderna porque escala bem em representacao.',
      'Context window e tokenizacao mudam custo, qualidade e comportamento.',
    ],
    practice: [
      'Fazer inferencia e inspecionar tokens, logits e attention maps.',
      'Comparar encoder, decoder e modelo multimodal em pequena tarefa.',
    ],
    projects: [
      'Mini app comparando modelos e tamanhos de contexto.',
      'Explorador visual de attention e tokenizacao.',
    ],
    articles: [
      mkLink('📰', 'The Annotated Transformer', 'http://nlp.seas.harvard.edu/2018/04/03/attention.html'),
      mkLink('📰', 'Attention Is All You Need', 'https://arxiv.org/abs/1706.03762'),
    ],
  },
  rl: {
    topics: [
      'Reward design e exploracao',
      'Value-based vs policy-based methods',
      'PPO para treino pratico',
    ],
    quickNotes: [
      'Reward mal desenhada gera agente esperto do jeito errado.',
      'RL e muito mais sensivel a ambiente e logging do que parece.',
    ],
    practice: [
      'Treinar PPO em ambiente simples e acompanhar learning curve.',
      'Alterar reward function e observar comportamento emergente.',
    ],
    projects: [
      'Agente RL para jogo simples com dashboard de treino.',
      'Experimento comparando DQN e PPO em ambiente controlado.',
    ],
    articles: [
      mkLink('📰', 'Playing Atari with Deep Reinforcement Learning', 'https://arxiv.org/abs/1312.5602'),
      mkLink('📰', 'Proximal Policy Optimization Algorithms', 'https://arxiv.org/abs/1707.06347'),
    ],
  },
  llm: {
    topics: [
      'RAG, agentes e ferramentas',
      'Avaliacao de resposta e grounding',
      'Aplicacoes de linguagem em producao',
    ],
    quickNotes: [
      'Boa aplicacao com LLM depende tanto de retrieval quanto do modelo.',
      'Avaliar resposta automaticamente exige rubrica e conjunto de teste.',
    ],
    practice: [
      'Montar fluxo RAG com retrieval, rerank e avaliacao.',
      'Criar agente com ferramenta simples e logs de execucao.',
    ],
    projects: [
      'Assistente RAG para base documental real.',
      'Agente com ferramentas para tarefas multi-etapas.',
    ],
    articles: [
      mkLink('📰', 'Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks', 'https://arxiv.org/abs/2005.11401'),
      mkLink('📰', 'ReAct: Synergizing Reasoning and Acting in Language Models', 'https://arxiv.org/abs/2210.03629'),
    ],
  },
  finetune: {
    topics: [
      'Adapters, quantizacao e alinhamento',
      'Supervised fine-tuning e preference optimization',
      'Custo e qualidade no ajuste de LLMs',
    ],
    quickNotes: [
      'Nem todo caso precisa fine-tuning; muitas vezes RAG basta.',
      'Dados de ajuste definem resultado mais que hiperparametro fino.',
    ],
    practice: [
      'Rodar LoRA/QLoRA em dataset pequeno e medir custo.',
      'Comparar SFT vs DPO em conjunto de prompts controlado.',
    ],
    projects: [
      'Modelo ajustado para dominio especifico com card e avaliacao.',
      'Experimento comparando quantizacao e qualidade final.',
    ],
    articles: [
      mkLink('📰', 'LoRA: Low-Rank Adaptation of Large Language Models', 'https://arxiv.org/abs/2106.09685'),
      mkLink('📰', 'QLoRA: Efficient Finetuning of Quantized LLMs', 'https://arxiv.org/abs/2305.14314'),
      mkLink('📰', 'Direct Preference Optimization', 'https://arxiv.org/abs/2305.18290'),
    ],
  },
  mlops: {
    topics: [
      'Registro, deploy, monitoramento e governanca',
      'Observabilidade de modelo e dados',
      'Custos, incidentes e reproducibilidade',
    ],
    quickNotes: [
      'Modelo sem monitoramento e so uma aposta em producao.',
      'Tracking bom encurta debugging e comparacao de experimentos.',
    ],
    practice: [
      'Versionar experimento completo com metricas, dados e artefatos.',
      'Simular drift e criar regra de alerta/rollback.',
    ],
    projects: [
      'Mini plataforma de tracking e registry para um modelo.',
      'Pipeline de monitoramento com alertas e relatorio de drift.',
    ],
  },
  infra: {
    topics: [
      'Containerizacao, orquestracao e infra como codigo',
      'Serving em GPU e custo operacional',
      'Resiliencia e resposta a incidentes',
    ],
    quickNotes: [
      'Deploy bom precisa previsibilidade de ambiente e observabilidade.',
      'Latencia e custo andam juntos em serving de IA.',
    ],
    practice: [
      'Empacotar modelo em container e subir em cluster simples.',
      'Comparar custo e latencia em duas estrategias de deploy.',
    ],
    projects: [
      'Stack local com Docker + k8s para inferencia.',
      'Infra declarativa para API de modelo com monitoring basico.',
    ],
  },
  portfolio: {
    topics: [
      'Repos com contexto, resultado e demo',
      'Writeups tecnicos e narrativa de decisao',
      'Open source como prova de colaboracao',
    ],
    quickNotes: [
      'Projeto sem README forte perde metade do valor.',
      'Portifolio bom mostra criterio, nao volume aleatorio.',
    ],
    practice: [
      'Reescrever README focando problema, abordagem e impacto.',
      'Publicar demo ou screenshot para cada projeto principal.',
    ],
    projects: [
      'Montar site-hub com casos tecnicos e links publicos.',
      'Criar case study completo de um projeto de IA aplicado.',
    ],
  },
  interview: {
    topics: [
      'Algoritmos, design e historias comportamentais',
      'Comunicacao de tradeoffs',
      'Feedback loop e iteracao de entrevistas',
    ],
    quickNotes: [
      'Entrevista boa e clareza de raciocinio, nao velocidade cega.',
      'System design precisa requisitos antes de componentes.',
    ],
    practice: [
      'Gravar mock interview e revisar pontos de travamento.',
      'Treinar uma historia STAR por experiencia relevante.',
    ],
    projects: [
      'Banco pessoal de perguntas e respostas de entrevista.',
      'Guia proprio de system design com diagramas recorrentes.',
    ],
  },
  career: {
    topics: [
      'CV, networking e aplicacao internacional',
      'Posicionamento tecnico em ingles',
      'Negociacao e leitura de mercado',
    ],
    quickNotes: [
      'Headline e curriculo precisam mostrar impacto mensuravel.',
      'Networking util nasce de consistencia, nao de spam.',
    ],
    practice: [
      'Reescrever CV com bullets orientados a resultado.',
      'Enviar outreach curto e contextualizado para 5 pessoas alvo.',
    ],
    projects: [
      'Landing page profissional com portfolio e bio curta.',
      'Planilha de vagas, follow-ups e funil de entrevistas.',
    ],
    articles: [
      mkLink('📰', 'Chip Huyen — What We Look For in ML Candidates', 'https://huyenchip.com/2023/01/24/what-we-look-for-in-ml-candidates.html'),
    ],
  },
  research: {
    topics: [
      'Leitura critica de paper',
      'Reproducao e ablation study',
      'Publicacao de notas tecnicas',
    ],
    quickNotes: [
      'Paper so vira skill quando e reproduzido ou adaptado.',
      'Ablation curta ensina mais do que leitura passiva longa.',
    ],
    practice: [
      'Reproduzir um paper pequeno e registrar divergencias.',
      'Escrever nota curta resumindo hipotese, metodo e limites.',
    ],
    projects: [
      'Repositorio de reproducoes com metricas e diferencas.',
      'Newsletter pessoal de papers relevantes para sua trilha.',
    ],
    articles: [
      mkLink('📰', 'The Bitter Lesson', 'http://www.incompleteideas.net/IncIdeas/BitterLesson.html'),
    ],
  },
  leadership: {
    topics: [
      'Ownership tecnico e alinhamento com negocio',
      'RFCs, decisoes e postmortems',
      'Impacto em time, sistema e produto',
    ],
    quickNotes: [
      'Senioridade aparece em criterio, priorizacao e comunicacao.',
      'Ownership sem feedback de negocio e so atividade tecnica.',
    ],
    practice: [
      'Escrever RFC curta comparando duas opcoes tecnicas.',
      'Fazer postmortem simples de falha ou atraso real.',
    ],
    projects: [
      'Criar template de ADR/RFC para futuros projetos.',
      'Montar dashboard de ownership com KPI, risco e entregas.',
    ],
  },
  robotics_math: {
    topics: [
      'Frames, transformações homogêneas e quaternions',
      'Jacobianos, cinemática direta e inversa',
      'Dinâmica básica, torque e estabilidade',
    ],
    quickNotes: [
      'Sem cinemática sólida, MoveIt e controle viram caixa-preta.',
      'Quaternions evitam dor com orientação 3D e gimbal lock.',
    ],
    practice: [
      'Implementar cinemática direta/inversa de um braço 2D ou 3D.',
      'Visualizar transformações SE(3) e orientação com quaternions.',
    ],
    projects: [
      'Notebook interativo de cinemática e Jacobianos.',
      'Simulador simples de braço robótico com forward/inverse kinematics.',
    ],
    articles: [
      mkLink('📰', 'A Tutorial on SE(3) Transformation Parameterizations and On-Manifold Optimization', 'https://arxiv.org/abs/1812.01537'),
    ],
  },
  robotics_core: {
    topics: [
      'ROS 2: nós, tópicos, serviços, actions e parâmetros',
      'URDF, sensores e simulação com Gazebo/Isaac',
      'Build, launch e debug de robôs simulados',
    ],
    quickNotes: [
      'ROS 2 é integração de sistema, não só biblioteca.',
      'Simulação boa acelera iteração e reduz risco no hardware.',
    ],
    practice: [
      'Subir workspace ROS 2 e publicar/consumir tópicos em Python.',
      'Modelar robô diferencial em URDF e rodar no Gazebo.',
    ],
    projects: [
      'Robô diferencial em labirinto simulado com sensores básicos.',
      'Pacote ROS 2 com launch files, RViz e teleop.',
    ],
    articles: [
      mkLink('📰', 'Why ROS 2?', 'https://design.ros2.org/articles/why_ros2.html'),
    ],
  },
  robotics_nav: {
    topics: [
      'SLAM, localização probabilística e costmaps',
      'Planejamento global/local com Nav2',
      'Manipulação e trajetória com MoveIt 2',
    ],
    quickNotes: [
      'Navegação boa depende tanto de percepção quanto de tuning.',
      'Manipulação exige cinemática, colisão e planejamento coerentes.',
    ],
    practice: [
      'Rodar SLAM e depois navegar A->B com obstáculos dinâmicos.',
      'Planejar pick-and-place simples em braço simulado com MoveIt 2.',
    ],
    projects: [
      'AMR simulado navegando em warehouse 2D.',
      'Braço robótico pegando e soltando objetos em cena simulada.',
    ],
    articles: [
      mkLink('📰', 'ORB-SLAM3', 'https://arxiv.org/abs/2007.11898'),
      mkLink('📰', 'MoveIt: An Open Source Robotics Motion Planning Framework', 'https://moveit.ai/moveit/ros/2019/03/11/robotics-motion-planning-framework.html'),
    ],
  },
  robotics_hw: {
    topics: [
      'Integração com sensores, atuadores e microcontroladores',
      'Deploy em Raspberry Pi e debug no robô real',
      'Latência, energia, ruído e calibração física',
    ],
    quickNotes: [
      'Hardware real sempre revela problemas que a simulação esconde.',
      'Logs, alimentação e calibração são parte do software de robótica.',
    ],
    practice: [
      'Subir nó ROS 2 em Raspberry Pi e integrar sensor real.',
      'Calibrar câmera, IMU ou encoder e registrar diferenças entre runs.',
    ],
    projects: [
      'Robô físico low-cost com navegação e telemetria básica.',
      'Stack de diagnóstico para sensores, motores e bateria.',
    ],
  },
  robotics_ai: {
    topics: [
      'RL em simulação e sim-to-real',
      'Imitation learning e teleop',
      'Vision-language-action e foundation models para robótica',
    ],
    quickNotes: [
      'Robótica com IA precisa dados bons, sim confiável e avaliação física.',
      'Foundation models ainda sofrem muito com robustez no mundo real.',
    ],
    practice: [
      'Treinar política em Isaac Lab e medir transferência para novo domínio.',
      'Coletar demonstrações e comparar BC/DAgger em tarefa simples.',
    ],
    projects: [
      'Política de manipulação treinada em sim com vídeo demo.',
      'Pipeline VLA/LeRobot para tarefa curta com documentação completa.',
    ],
    articles: [
      mkLink('📰', 'RT-2: Vision-Language-Action Models Transfer Web Knowledge to Robotic Control', 'https://arxiv.org/abs/2307.15818'),
      mkLink('📰', 'OpenVLA', 'https://arxiv.org/abs/2406.09246'),
    ],
  },
  agents_core: {
    topics: [
      'Tool use, function calling e JSON estruturado',
      'Grafos de estado, checkpoints e loops ReAct',
      'Memória curta, longa e retrieval para contexto operacional',
    ],
    quickNotes: [
      'Agente útil depende mais de contratos de entrada/saída do que de prompt longo.',
      'Estado explícito evita loops frágeis e facilita recuperação após erro.',
    ],
    practice: [
      'Criar agente que chama 2 ferramentas e retorna saída validada por schema.',
      'Persistir mensagens, artefatos e decisões em um grafo simples com checkpoints.',
    ],
    projects: [
      'Agente de pesquisa que consulta API, normaliza dados e entrega relatório estruturado.',
      'Assistente operacional que abre ticket, consulta status e gera sumário auditável.',
    ],
    articles: [
      mkLink('📰', 'ReAct: Synergizing Reasoning and Acting in Language Models', 'https://arxiv.org/abs/2210.03629'),
      mkLink('📰', 'Toolformer: Language Models Can Teach Themselves to Use Tools', 'https://arxiv.org/abs/2302.04761'),
    ],
  },
  agents_arch: {
    topics: [
      'Supervisor, hierárquico e colaborativo',
      'Planner/executor e papéis especializados',
      'Handoffs com contexto, contrato e critérios de término',
    ],
    quickNotes: [
      'Multiagente sem protocolo de handoff vira duplicação e perda de contexto.',
      'Planner decompõe o trabalho; supervisor governa quem faz o quê e quando.',
    ],
    practice: [
      'Separar um fluxo em planner, pesquisador, escritor e revisor.',
      'Comparar single-agent versus multi-agent para tarefa de análise mais longa.',
    ],
    projects: [
      'Sistema multiagente para análise de empresa com pesquisa, síntese e relatório.',
      'Pipeline de due diligence com supervisor e especialistas por domínio.',
    ],
    articles: [
      mkLink('📰', 'AutoGen: Enabling Next-Gen LLM Applications via Multi-Agent Conversation', 'https://arxiv.org/abs/2308.08155'),
      mkLink('📰', 'CAMEL: Communicative Agents for Mind Exploration of Large Language Model Society', 'https://arxiv.org/abs/2303.17760'),
    ],
  },
  agents_reliability: {
    topics: [
      'Human-in-the-loop, approvals e rollback',
      'Tracing, métricas, regressão e suites de avaliação',
      'Guardrails, políticas de permissão e limites operacionais',
    ],
    quickNotes: [
      'Agente em produção sem traces vira caixa-preta cara e difícil de depurar.',
      'Avaliação boa precisa tarefa fixa, rubrica clara e casos adversariais.',
    ],
    practice: [
      'Criar harness de avaliação com tarefas, rubrica e dataset de regressão.',
      'Adicionar gate humano antes de e-mail, deploy, compra ou ação destrutiva.',
    ],
    projects: [
      'Dashboard com traces, custo, latência e taxa de sucesso por fluxo.',
      'Camada de segurança com políticas, allowlist de tools e aprovação humana.',
    ],
    articles: [
      mkLink('📰', 'Reflexion: Language Agents with Verbal Reinforcement Learning', 'https://arxiv.org/abs/2303.11366'),
      mkLink('📰', 'Constitutional AI: Harmlessness from AI Feedback', 'https://arxiv.org/abs/2212.08073'),
    ],
  },
  agents_automation: {
    topics: [
      'Computer use, browser agents e grounding visual',
      'n8n/Make para orquestração com IA e APIs',
      'Integração com sistemas legados quando não existe API útil',
    ],
    quickNotes: [
      'Browser automation com IA precisa retry, seletor estável e evidência visual.',
      'Workflow visual acelera integração, mas não substitui logs e avaliação.',
    ],
    practice: [
      'Automatizar login, busca, extração e exportação em sistema web de teste.',
      'Encadear LLM, API e browser fallback em um fluxo n8n com logs.',
    ],
    projects: [
      'Agente que executa processo web ponta a ponta e salva screenshots por etapa.',
      'Workflow de triagem documental que aciona humano só em exceções.',
    ],
    articles: [
      mkLink('📰', 'Mind2Web: Towards a Generalist Agent for the Web', 'https://arxiv.org/abs/2306.06070'),
      mkLink('📰', 'WebArena: A Realistic Web Environment for Building Autonomous Agents', 'https://arxiv.org/abs/2307.13854'),
    ],
  },
  automation_core: {
    topics: [
      'RPA clássico versus RPA com visão, OCR e LLM',
      'Mapeamento de processo, checkpoints e trilha de auditoria',
      'Automação orientada a SLA, exceção e ROI',
    ],
    quickNotes: [
      'RPA sem observabilidade quebra silenciosamente quando a UI muda.',
      'IA ajuda na decisão ambígua, mas precisa evidência, fallback e aprovação.',
    ],
    practice: [
      'Mapear um processo manual com entradas, exceções e etapa humana.',
      'Automatizar triagem de e-mails ou documentos com validação antes da ação final.',
    ],
    projects: [
      'Bot que lê anexo, extrai dados e abre ticket com log completo.',
      'Fluxo de backoffice com OCR, validação humana e envio para ERP/CRM.',
    ],
  },
  automation_api: {
    topics: [
      'REST APIs, autenticação, webhooks e contratos de integração',
      'Idempotência, retries, timeouts e tratamento de falhas',
      'Workers assíncronos e scheduling para tarefas pesadas',
    ],
    quickNotes: [
      'Automação sem idempotência duplica cobrança, envio ou atualização.',
      'Fila isola latência externa e dá margem para retry seguro.',
    ],
    practice: [
      'Criar endpoint webhook que valida payload e dispara tarefa em background.',
      'Subir worker com retry exponencial para integração com API instável.',
    ],
    projects: [
      'API de automação que recebe evento, consulta terceiros e publica resultado.',
      'Hub de integrações com FastAPI, Celery, Redis e painel de execução.',
    ],
  },
  automation_frameworks: {
    topics: [
      'LangChain, LCEL, retrievers e tool abstractions',
      'LangGraph e Google ADK para apps/agentes stateful',
      'Sessões, memória, tracing e composição de ferramentas',
    ],
    quickNotes: [
      'Framework ajuda quando há contrato, estado e observabilidade; sem isso só mascara bagunça.',
      'SDK de agente não substitui desenho de fluxo, segurança e avaliação.',
    ],
    practice: [
      'Construir app com retriever, tool e saída estruturada em um fluxo único.',
      'Comparar LangChain/LangGraph e Google ADK na mesma tarefa de automação.',
    ],
    projects: [
      'Copiloto operacional com tools, memória e endpoints próprios.',
      'Executor de tarefas com Google ADK conectado a APIs internas e aprovação humana.',
    ],
    articles: [
      mkLink('📰', 'ReAct: Synergizing Reasoning and Acting in Language Models', 'https://arxiv.org/abs/2210.03629'),
      mkLink('📰', 'AutoGen: Enabling Next-Gen LLM Applications via Multi-Agent Conversation', 'https://arxiv.org/abs/2308.08155'),
    ],
  },
  automation_workflows: {
    topics: [
      'Triggers, branches, retries e human approval em ferramentas visuais',
      'Integração entre SaaS, LLMs, APIs internas e filas',
      'Versionamento, logs e governança de workflows',
    ],
    quickNotes: [
      'Workflow visual acelera integração, mas não elimina necessidade de versionar lógica crítica.',
      'Cada nó do fluxo precisa de timeout, retry e payload minimamente estável.',
    ],
    practice: [
      'Criar fluxo no n8n que recebe webhook, chama LLM e pede aprovação antes de executar.',
      'Montar cenário Make integrando planilha, CRM e notificação automática.',
    ],
    projects: [
      'Orquestrador de leads com classificação IA, enriquecimento e handoff para vendas.',
      'Pipeline documental low-code com resumo, aprovação e envio para sistema final.',
    ],
  },
  automation_browser: {
    topics: [
      'Selectors, waits, screenshots, traces e prevenção de flakiness',
      'Browser automation versus API integration direta',
      'Execução visual auditável para RPA, testes e scraping',
    ],
    quickNotes: [
      'Selector estável vale mais que script longo cheio de sleep.',
      'Se existe API boa, browser deve ser fallback e não primeira escolha.',
    ],
    practice: [
      'Automatizar login, busca, exportação e evidência visual de cada etapa.',
      'Comparar Playwright e Selenium na mesma tarefa e medir robustez.',
    ],
    projects: [
      'Robô de browser com evidência em screenshot e trilha de execução.',
      'Executor visual para sistema legado sem API usando fallback humano.',
    ],
    articles: [
      mkLink('📰', 'Mind2Web: Towards a Generalist Agent for the Web', 'https://arxiv.org/abs/2306.06070'),
      mkLink('📰', 'WebArena: A Realistic Web Environment for Building Autonomous Agents', 'https://arxiv.org/abs/2307.13854'),
    ],
  },
  automation_industrial: {
    topics: [
      'MQTT, Node-RED e fluxo edge/cloud para IIoT',
      'Séries temporais, dashboards e alertas operacionais',
      'Arquitetura sensor -> ingestão -> modelo -> ação em produção',
    ],
    quickNotes: [
      'Em automação industrial, atraso, ruído e perda de pacote importam tanto quanto o modelo.',
      'Dashboard sem alarme acionável não fecha o loop operacional.',
    ],
    practice: [
      'Publicar eventos MQTT e consumi-los em fluxo Node-RED com alerta.',
      'Montar dashboard InfluxDB/Grafana com telemetria de linha simulada.',
    ],
    projects: [
      'Pipeline de manutenção preditiva com telemetria e dashboard em tempo real.',
      'Fluxo industrial completo com Node-RED, mensageria, modelo e notificação.',
    ],
  },
};

const CONTENT_LIBRARY = {
  trail: composeContentPatch(withoutCmds(CONTENT_PACKS.trail), CONTENT_ENHANCEMENTS.trail),
  math: composeContentPatch(withoutCmds(CONTENT_PACKS.math), CONTENT_ENHANCEMENTS.math),
  linux: composeContentPatch(CONTENT_PACKS.linux, CONTENT_ENHANCEMENTS.linux),
  algo: composeContentPatch(withoutCmds(CONTENT_PACKS.algo), CONTENT_ENHANCEMENTS.algo),
  python: composeContentPatch(CONTENT_PACKS.python, CONTENT_ENHANCEMENTS.python),
  git: composeContentPatch(CONTENT_PACKS.git, CONTENT_ENHANCEMENTS.git),
  sql: composeContentPatch(CONTENT_PACKS.sql, CONTENT_ENHANCEMENTS.sql),
  data: composeContentPatch(CONTENT_PACKS.data, CONTENT_ENHANCEMENTS.data),
  stats: composeContentPatch(withoutCmds(CONTENT_PACKS.stats), CONTENT_ENHANCEMENTS.stats),
  ml: composeContentPatch(CONTENT_PACKS.ml, CONTENT_ENHANCEMENTS.ml),
  feature: composeContentPatch(CONTENT_PACKS.feature, CONTENT_ENHANCEMENTS.feature),
  dl: composeContentPatch(CONTENT_PACKS.dl, CONTENT_ENHANCEMENTS.dl),
  pytorch: composeContentPatch(CONTENT_PACKS.pytorch, CONTENT_ENHANCEMENTS.pytorch),
  vision: composeContentPatch(CONTENT_PACKS.vision, CONTENT_ENHANCEMENTS.vision),
  transformers: composeContentPatch(CONTENT_PACKS.transformers, CONTENT_ENHANCEMENTS.transformers),
  rl: composeContentPatch(CONTENT_PACKS.rl, CONTENT_ENHANCEMENTS.rl),
  llm: composeContentPatch(CONTENT_PACKS.llm, CONTENT_ENHANCEMENTS.llm),
  finetune: composeContentPatch(CONTENT_PACKS.finetune, CONTENT_ENHANCEMENTS.finetune),
  mlops: composeContentPatch(CONTENT_PACKS.mlops, CONTENT_ENHANCEMENTS.mlops),
  infra: composeContentPatch(CONTENT_PACKS.infra, CONTENT_ENHANCEMENTS.infra),
  portfolio: composeContentPatch(CONTENT_PACKS.portfolio, CONTENT_ENHANCEMENTS.portfolio),
  interview: composeContentPatch(withoutCmds(CONTENT_PACKS.interview), CONTENT_ENHANCEMENTS.interview),
  career: composeContentPatch(withoutCmds(CONTENT_PACKS.career), CONTENT_ENHANCEMENTS.career),
  research: composeContentPatch(withoutCmds(CONTENT_PACKS.research), CONTENT_ENHANCEMENTS.research),
  leadership: composeContentPatch(withoutCmds(CONTENT_PACKS.leadership), CONTENT_ENHANCEMENTS.leadership),
  robotics_math: composeContentPatch(withoutCmds(CONTENT_PACKS.robotics_math), CONTENT_ENHANCEMENTS.robotics_math),
  robotics_core: composeContentPatch(CONTENT_PACKS.robotics_core, CONTENT_ENHANCEMENTS.robotics_core),
  robotics_nav: composeContentPatch(CONTENT_PACKS.robotics_nav, CONTENT_ENHANCEMENTS.robotics_nav),
  robotics_hw: composeContentPatch(CONTENT_PACKS.robotics_hw, CONTENT_ENHANCEMENTS.robotics_hw),
  robotics_ai: composeContentPatch(withoutCmds(CONTENT_PACKS.robotics_ai), CONTENT_ENHANCEMENTS.robotics_ai),
  agents_core: composeContentPatch(CONTENT_PACKS.agents_core, CONTENT_ENHANCEMENTS.agents_core),
  agents_arch: composeContentPatch(withoutCmds(CONTENT_PACKS.agents_arch), CONTENT_ENHANCEMENTS.agents_arch),
  agents_reliability: composeContentPatch(withoutCmds(CONTENT_PACKS.agents_reliability), CONTENT_ENHANCEMENTS.agents_reliability),
  agents_automation: composeContentPatch(CONTENT_PACKS.agents_automation, CONTENT_ENHANCEMENTS.agents_automation),
  automation_core: composeContentPatch(CONTENT_PACKS.automation_core, CONTENT_ENHANCEMENTS.automation_core),
  automation_api: composeContentPatch(CONTENT_PACKS.automation_api, CONTENT_ENHANCEMENTS.automation_api),
  automation_frameworks: composeContentPatch(CONTENT_PACKS.automation_frameworks, CONTENT_ENHANCEMENTS.automation_frameworks),
  automation_workflows: composeContentPatch(CONTENT_PACKS.automation_workflows, CONTENT_ENHANCEMENTS.automation_workflows),
  automation_browser: composeContentPatch(CONTENT_PACKS.automation_browser, CONTENT_ENHANCEMENTS.automation_browser),
  automation_industrial: composeContentPatch(CONTENT_PACKS.automation_industrial, CONTENT_ENHANCEMENTS.automation_industrial),
};

const CONTENT_BY_NODE = {};

[
  ['trail', ['root']],
  ['math', ['math', 'lin_alg', 'calculo', 'probabilidade']],
  ['linux', ['linux', 'shell_script', 'tmux_ops', 'monitoring_cli']],
  ['algo', ['prog', 'dsa', 'complexidade', 'recursao', 'patterns', 'graphs', 'trees', 'greedy_dp']],
  ['python', ['python', 'py_oop', 'py_async', 'py_perf']],
  ['git', ['git', 'ci_cd', 'release_flow', 'code_review']],
  ['sql', ['sql', 'data_modeling', 'index_tuning', 'warehouse']],
  ['data', ['numpy', 'viz', 'polars', 'spark', 'feature_store']],
  ['stats', ['stats', 'causal', 'ab_testing', 'uncertainty']],
  ['ml', ['ml', 'recommender', 'timeseries', 'anomaly']],
  ['feature', ['feat', 'data_validation', 'imbalanced', 'leakage']],
  ['dl', ['dl', 'self_supervised', 'regularization', 'nn_optimization']],
  ['pytorch', ['pytorch', 'lightning', 'dist_train', 'compile_infer']],
  ['vision', ['cnn', 'obj_detect', 'segment', 'ocr']],
  ['transformers', ['transf', 'bert_gpt', 'llm_internals', 'diffusion', 'multimodal']],
  ['rl', ['rl']],
  ['llm', ['nlp', 'rag_systems', 'agents', 'llm_eval']],
  ['finetune', ['finetun', 'lora', 'qlora', 'dpo']],
  ['mlops', ['mlops', 'registry', 'monitoring', 'governance']],
  ['infra', ['docker', 'k8s', 'terraform', 'gpu_serving', 'latency_opt', 'cost_opt', 'incident']],
  ['portfolio', ['portf', 'open_source', 'case_studies', 'tech_writing']],
  ['interview', ['leet', 'system_design', 'mock_interview', 'behavioral']],
  ['career', ['mercado', 'cv_english', 'networking', 'negotiation']],
  ['research', ['research_loop']],
  ['leadership', ['project_ownership', 'global_impact']],
  ['robotics_math', ['kin_dyn', 'control']],
  ['robotics_core', ['ros2', 'gazebo']],
  ['robotics_nav', ['slam', 'nav2', 'moveit2']],
  ['robotics_hw', ['robot_hw']],
  ['robotics_ai', ['sim2real', 'imitation', 'vla', 'lerobot']],
  ['agents_core', ['agent_tools', 'agent_state', 'agent_memory']],
  ['agents_arch', ['agent_supervisor', 'agent_planner', 'agent_workers', 'agent_handoffs']],
  ['agents_reliability', ['agent_hitl', 'agent_evalops', 'agent_safety']],
  ['agents_automation', ['computer_use', 'agent_workflows']],
  ['automation_core', ['automation_ai', 'rpa_ai']],
  ['automation_api', ['api_auto', 'fastapi_hooks', 'task_queue']],
  ['automation_frameworks', ['langchain_stack', 'google_adk']],
  ['automation_workflows', ['n8n_flow', 'make_flow']],
  ['automation_browser', ['browser_auto', 'playwright_auto', 'selenium_auto']],
  ['automation_industrial', ['industrial_iiot', 'mqtt_iiot', 'node_red_auto', 'ts_observability', 'industrial_workflows']],
].forEach(([packName, ids]) => {
  ids.forEach((id) => {
    CONTENT_BY_NODE[id] = CONTENT_LIBRARY[packName] || CONTENT_PACKS[packName];
  });
});

const extraNodes = [];
const extraEdges = [];

for (const group of EXPANSION_GROUPS) {
  const ids = [];
  for (const [id, lbl, desc] of group.nodes) {
    extraNodes.push(mkNode(id, lbl, group.ly, group.pal, desc));
    ids.push(id);
    extraEdges.push([group.parent, id]);
  }
  for (let i = 0; i < ids.length - 1; i += 1) {
    extraEdges.push([ids[i], ids[i + 1]]);
  }
}

for (let i = 1; i < EXPANSION_GROUPS.length; i += 1) {
  const prev = EXPANSION_GROUPS[i - 1].nodes.map((n) => n[0]);
  const curr = EXPANSION_GROUPS[i].nodes.map((n) => n[0]);
  const lim = Math.min(prev.length, curr.length);
  for (let j = 0; j < lim; j += 1) {
    extraEdges.push([prev[j], curr[j]]);
  }
}

const allNodes = CORE_NODES.concat(extraNodes, ROBOTICS_NODES, AGENT_SYSTEMS_NODES, AUTOMATION_NODES, FRONTIER_NODES);
allNodes.forEach((node) => {
  mergeNodeContent(node, CONTENT_BY_NODE[node.id] || CONTENT_LIBRARY.trail);
});

const allEdges = CORE_EDGES
  .concat(extraEdges)
  .concat(EXPANSION_CROSS_EDGES)
  .concat(ROBOTICS_EDGES)
  .concat(AGENT_SYSTEMS_EDGES)
  .concat(AUTOMATION_EDGES)
  .concat(FRONTIER_EDGES);

const uniqueEdges = [];
const edgeSet = new Set();
for (const [a, b] of allEdges) {
  const key = `${a}=>${b}`;
  if (edgeSet.has(key)) continue;
  edgeSet.add(key);
  uniqueEdges.push([a, b]);
}

window.MN = allNodes;
window.ME = uniqueEdges;

window.MAP_LAYER_NAMES = [
  'Núcleo',
  'Fundamentos',
  'Base Técnica',
  'Ferramentas',
  'Dados',
  'Machine Learning',
  'Deep Learning',
  'Arquiteturas',
  'LLMs',
  'MLOps',
  'Carreira',
  'Fronteira',
  'Liderança',
  'Impacto',
];

window.MAP_CATEGORY_GROUPS = {
  robotics: {
    label: 'Robótica',
    color: '#7ee787',
    ids: ['kin_dyn', 'ros2', 'gazebo', 'slam', 'control', 'nav2', 'moveit2', 'robot_hw', 'sim2real', 'imitation', 'vla', 'lerobot'],
  },
  agents: {
    label: 'Agentes',
    color: '#d2a8ff',
    ids: ['agents', 'agent_tools', 'agent_state', 'agent_memory', 'agent_supervisor', 'agent_planner', 'agent_workers', 'agent_handoffs', 'agent_hitl', 'agent_evalops', 'agent_safety', 'computer_use', 'agent_workflows'],
  },
  automation: {
    label: 'Automação',
    color: '#58a6ff',
    ids: ['automation_ai', 'rpa_ai', 'api_auto', 'langchain_stack', 'industrial_iiot', 'browser_auto', 'fastapi_hooks', 'task_queue', 'google_adk', 'n8n_flow', 'make_flow', 'mqtt_iiot', 'node_red_auto', 'playwright_auto', 'selenium_auto', 'ts_observability', 'industrial_workflows', 'computer_use', 'agent_workflows'],
  },
  llms: {
    label: 'LLMs',
    color: '#f78166',
    ids: ['transf', 'bert_gpt', 'llm_internals', 'diffusion', 'multimodal', 'nlp', 'rag_systems', 'agents', 'llm_eval', 'finetun', 'lora', 'qlora', 'dpo', 'langchain_stack'],
  },
};
