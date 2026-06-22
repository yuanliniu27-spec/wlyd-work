const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const plan = [
  "读取 CRM 客户、线索、商机和历史跟进记录",
  "按生产型、贸易型、物流型判断客户类型，并识别是否属于黄金客户",
  "生成客户图谱：行业品类、已触达关系、未开拓机会和业绩增长点",
  "联网查询企业档案、招聘信息、招投标、B2B平台与地图园区线索",
  "识别 KP 地图：老板、财务、调度、车队长、门卫/司机等关键人",
  "输出切入策略、产品组合、拜访问题和 CRM 更新草稿"
];

const logs = [
  "已识别客户主体：上海恒驰冷链物流有限公司",
  "已查询 CRM：2 条线索、1 个商机、3 次跟进记录",
  "已按客户图谱判断：物流型企业，冷链运输场景明确，属于优先开拓客户",
  "已联网查询招聘、车辆、园区与公开招投标线索，补充客户需求证据",
  "已生成 KP 地图：老板/总经理、财务负责人、调度负责人、车队长为重点对象",
  "已生成切入策略、拜访问题、产品组合与 CRM 更新草稿"
];

const agentMessages = [
  {
    type: "risk",
    icon: "!",
    title: "商机风险预警",
    body: "「上海慧星冷链有限公司」新增一条工商高风险预警，请关注～",
    time: "刚刚"
  },
  {
    type: "timeout",
    icon: "⏱",
    title: "跟进超时",
    body: "原计划6.19日跟进客户「成都德华汽贸有限公司」已超时1天，请及时跟进。",
    time: "10分钟前"
  },
  {
    type: "dynamic",
    icon: "↗",
    title: "客户动态提醒",
    body: "「上海恒驰冷链物流有限公司」近期新增冷链调度岗位，可能存在运力扩张需求。",
    time: "今天 09:42"
  }
];

let unreadMessages = agentMessages.length;

function toast(text) {
  const node = $("#toast");
  node.textContent = text;
  node.classList.add("show");
  setTimeout(() => node.classList.remove("show"), 2400);
}

function renderMessages() {
  const list = $("#messageList");
  if (!list) return;
  list.innerHTML = agentMessages.map((message) => `
    <article class="agent-message ${message.type}">
      <i>${message.icon}</i>
      <div>
        <strong>${message.title}</strong>
        <p>${message.body}</p>
        <time>${message.time}</time>
      </div>
    </article>
  `).join("");
}

function updateMessageBadge() {
  const badge = $("#messageBadge");
  if (!badge) return;
  badge.textContent = unreadMessages;
  badge.hidden = unreadMessages === 0;
}

function pushAgentMessage(message) {
  agentMessages.unshift(message);
  unreadMessages += 1;
  renderMessages();
  updateMessageBadge();
  showPushNotification(message);
}

function showPushNotification(message) {
  const node = $("#pushToast");
  node.className = `push-toast ${message.type}`;
  node.querySelector("i").textContent = message.icon;
  node.querySelector("strong").textContent = message.title;
  node.querySelector("span").textContent = message.body;
  requestAnimationFrame(() => node.classList.add("show"));
  setTimeout(() => {
    node.classList.add("closing");
    node.classList.remove("show");
  }, 2000);
  setTimeout(() => {
    node.className = "push-toast";
  }, 2450);
}

function resizeInput() {
  const input = $("#promptInput");
  input.style.height = "auto";
  input.style.height = `${Math.min(input.scrollHeight, 140)}px`;
}

function setPrompt(text) {
  $("#promptInput").value = text;
  resizeInput();
  $("#promptInput").focus();
}

function ensureStack() {
  $("#emptyState")?.remove();
  let stack = $(".message-stack");
  if (!stack) {
    stack = document.createElement("div");
    stack.className = "message-stack";
    $("#conversation").appendChild(stack);
  }
  return stack;
}

function addUserMessage(text) {
  const stack = ensureStack();
  const bubble = document.createElement("div");
  bubble.className = "bubble user";
  bubble.textContent = text;
  stack.appendChild(bubble);
  bubble.scrollIntoView({ behavior: "smooth", block: "end" });
}

function addAgentPlan() {
  const stack = ensureStack();
  const response = document.createElement("div");
  response.className = "agent-response";
  response.innerHTML = `
    <div class="agent-intro">
      <div>我会按销售 Agent 的方式先拆解任务。下面是执行计划，确认后我再调用客户、车辆、案例和 CRM 工具。</div>
    </div>
    <div class="agent-card">
      <h3>执行计划</h3>
      <ol class="plan-list">
        ${plan.map((item, index) => `<li data-step="${index + 1}">${item}</li>`).join("")}
      </ol>
      <div class="approve-row">
        <button class="primary approve">批准执行</button>
        <button class="secondary edit-plan">调整计划</button>
      </div>
    </div>
  `;
  stack.appendChild(response);
  attachCardActions(response.querySelector(".agent-card"));
  response.querySelector(".approve").addEventListener("click", () => runAgent(response));
  response.querySelector(".edit-plan").addEventListener("click", () => toast("已进入计划调整模式，可继续在输入框补充要求。"));
  response.scrollIntoView({ behavior: "smooth", block: "end" });
}

function attachCardActions(card) {
  if (!card || card.querySelector(".card-actions")) return;
  const actions = document.createElement("div");
  actions.className = "card-actions";
  actions.innerHTML = `
    <button data-action="copy" title="复制" aria-label="复制">
      <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="5" width="11" height="13" rx="3"></rect><rect x="4" y="9" width="11" height="13" rx="3"></rect></svg>
    </button>
    <button data-action="like" title="点赞" aria-label="点赞">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 21H4.8A1.8 1.8 0 0 1 3 19.2v-7.4A1.8 1.8 0 0 1 4.8 10H7v11Z"></path><path d="M7 10l4.7-6.1c.7-.9 2.1-.4 2.1.8v4.1h3.8c1.5 0 2.6 1.4 2.3 2.9l-1.2 6.2A3.9 3.9 0 0 1 14.9 21H7"></path></svg>
    </button>
    <button data-action="dislike" title="点踩" aria-label="点踩">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3H4.8A1.8 1.8 0 0 0 3 4.8v7.4A1.8 1.8 0 0 0 4.8 14H7V3Z"></path><path d="M7 14l4.7 6.1c.7.9 2.1.4 2.1-.8v-4.1h3.8c1.5 0 2.6-1.4 2.3-2.9l-1.2-6.2A3.9 3.9 0 0 0 14.9 3H7"></path></svg>
    </button>
    <button data-action="favorite" title="收藏" aria-label="收藏">
      <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="6" width="16" height="13" rx="4"></rect><path d="M8 6.5V5.8C8 4.8 8.8 4 9.8 4h4.4c1 0 1.8.8 1.8 1.8v.7"></path><path d="M12 10v5"></path><path d="M9.5 12.5h5"></path></svg>
    </button>
  `;
  card.appendChild(actions);
  actions.addEventListener("click", async (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    const action = button.dataset.action;
    if (action === "copy") {
      await copyText(card.innerText.replace(actions.innerText, "").trim());
      markAction(button, "已复制");
      return;
    }
    const labels = { like: "已点赞", dislike: "已反馈", favorite: "已收藏" };
    markAction(button, labels[action]);
  });
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }
}

function markAction(button, message) {
  button.classList.add("selected");
  toast(message);
}

function runAgent(response) {
  const card = document.createElement("div");
  card.className = "agent-card";
  card.innerHTML = `<h3>执行中</h3><div class="log-box"></div>`;
  response.appendChild(card);
  attachCardActions(card);
  const logBox = card.querySelector(".log-box");
  response.querySelector(".approve").disabled = true;
  response.querySelector(".approve").textContent = "执行中";

  logs.forEach((line, index) => {
    setTimeout(() => {
      const item = document.createElement("div");
      item.className = "log-line";
      item.innerHTML = `<span>✓</span><div>${line}</div>`;
      logBox.appendChild(item);
      item.scrollIntoView({ behavior: "smooth", block: "end" });
      if (index === logs.length - 1) addArtifact(response);
    }, 520 * (index + 1));
  });
}

function addArtifact(response) {
  const artifact = document.createElement("div");
  artifact.className = "agent-card";
  artifact.innerHTML = `
    <h3>已生成拜访准备包</h3>
    <div class="artifact-preview">
      <h4>上海恒驰冷链物流有限公司</h4>
      <p><strong>客户判断：</strong>物流型企业，冷链运输场景明确，具备高频运输、车辆资产、保险和旺季运力补充需求，属于优先开拓客户。</p>
      <ul>
        <li><strong>客户图谱：</strong>归类为物流型客户，重点关注冷链干线、城配、车辆规模、外协比例和上游货主来源。</li>
        <li><strong>线索证据：</strong>优先联网核验企业档案、招聘岗位、园区/地图信息、招投标和上下游合作线索。</li>
        <li><strong>KP 地图：</strong>主 KP 为老板/总经理和财务负责人；辅 KP 为调度负责人、车队长；门卫和司机可辅助获取上下游信息。</li>
        <li><strong>推荐切入：</strong>先用车险成本优化建立信任，再推进冷链车租赁试点，最后承接华东线路运力补位。</li>
        <li><strong>拜访重点：</strong>确认车辆规模、保险到期时间、旺季线路缺口、预算周期和当前合作车队。</li>
        <li><strong>治理节点：</strong>CRM 写入与机会发布需人工审批。</li>
      </ul>
    </div>
    <div class="artifact-actions">
      <button class="secondary">查看完整报告</button>
      <button class="secondary">导出PPT</button>
      <button class="primary write-crm">审批写入CRM</button>
    </div>
  `;
  response.appendChild(artifact);
  attachCardActions(artifact);
  artifact.querySelector(".write-crm").addEventListener("click", () => toast("已提交 CRM 写入审批。"));
  artifact.scrollIntoView({ behavior: "smooth", block: "end" });
  toast("任务完成，成果物已生成。");
}

function saveHistory(text) {
  const history = $("#historyList");
  if (!history) return;
  $$("#historyList .task-dot").forEach((dot) => dot.classList.remove("active"));
  const button = document.createElement("button");
  const title = text.length > 16 ? `${text.slice(0, 16)}...` : text;
  button.innerHTML = `<span class="task-dot active"></span>${title}`;
  const firstTask = history.querySelector("button");
  history.insertBefore(button, firstTask);
  bindHistoryButton(button);
}

function bindHistoryButton(button) {
  button.addEventListener("click", () => {
    const title = button.textContent.trim();
    restoreHistoryConversation(title, button);
  });
}

function restoreHistoryConversation(title, sourceButton) {
  $$("#historyList .task-dot").forEach((dot) => dot.classList.remove("active"));
  sourceButton?.querySelector(".task-dot")?.classList.add("active");
  $("#chatTitle").textContent = title;
  $("#conversation").innerHTML = `
    <div class="message-stack">
      <div class="bubble user">${title}</div>
      <div class="agent-response">
        <div class="thinking-line">已为你恢复这次历史对话，可继续追问、生成任务或查看上次结果。</div>
        <div class="agent-card">
          <h3>${title}</h3>
          <div class="artifact-preview">
            <p><strong>会话摘要：</strong>围绕客户洞察、销售机会、案例匹配或任务推进生成过销售建议。</p>
            <ul>
              <li>可继续让 Agent 补充客户画像、KP 地图或下一步动作。</li>
              <li>也可以基于该会话生成 CRM 跟进记录或拜访材料。</li>
            </ul>
          </div>
        </div>
      </div>
    </div>`;
  attachCardActions($("#conversation .agent-card"));
}

function sendTask() {
  const input = $("#promptInput");
  const text = input.value.trim() || "帮我分析上海恒驰冷链物流有限公司，生成客户洞察、案例匹配、产品推荐和拜访准备包。";
  if (isGeneralQuestion(text)) {
    addUserMessage(text);
    input.value = "";
    resizeInput();
    setTimeout(() => sendGeneralResponse(text), 240);
    return;
  }
  if (shouldUseSuggestionFlow(text)) {
    input.value = "";
    resizeInput();
    sendSuggestionTask(text);
    return;
  }
  saveHistory(text);
  addUserMessage(text);
  input.value = "";
  resizeInput();
  setTimeout(addAgentPlan, 320);
}

function shouldUseSuggestionFlow(text) {
  return [
    "今天有哪些工作任务",
    "今日工作任务",
    "优先跟进",
    "日历待办",
    "哪个名称的客户档案",
    "360客户画像",
    "客户洞察",
    "机会",
    "会议",
    "CRM",
    "案例",
    "公司车辆产品库",
    "车辆与运力",
    "运力规模",
    "话术",
    "异议",
    "成交风险",
    "帮我分析"
  ].some((keyword) => text.includes(keyword));
}

function isGeneralQuestion(text) {
  const normalized = text.trim().toLowerCase();
  return /^(你好|您好|hello|hi|嗨|在吗|早上好|下午好|晚上好)[！!。.\s]*$/.test(normalized)
    || /(天气|气温|下雨|降雨|今天冷不冷|今天热不热)/.test(text);
}

function sendGeneralResponse(text) {
  const stack = ensureStack();
  const response = document.createElement("div");
  response.className = "agent-response";
  const cityMatch = text.match(/北京|上海|广州|深圳|杭州|成都|天津|重庆|南京|苏州/);
  const city = cityMatch ? cityMatch[0] : "北京";
  if (/(天气|气温|下雨|降雨|今天冷不冷|今天热不热)/.test(text)) {
    response.innerHTML = `
      <div class="thinking-line">我先识别到这是通识类天气问题，不进入销售任务流程。</div>
      <div class="search-line"><span></span> 正在联网查询${city}今日天气...</div>
      <div class="agent-card structured-result">
        <h3>${city}今日天气</h3>
        <div class="stream-output">
          <section>
            <strong>天气概览</strong>
            <ul>
              <li>${city}今日以多云到晴为主，白天气温较高，建议外出注意防晒和补水。</li>
              <li>如需安排客户拜访，建议优先选择上午或傍晚时段，避开午后高温。</li>
              <li>天气数据以实时气象接口为准，出行前可再次刷新确认。</li>
            </ul>
          </section>
        </div>
      </div>
    `;
    stack.appendChild(response);
    attachCardActions(response.querySelector(".agent-card"));
    setTimeout(() => {
      response.querySelector(".search-line").innerHTML = `<span class="done"></span> 联网查询完成，已返回${city}今日天气。`;
    }, 580);
    response.scrollIntoView({ behavior: "smooth", block: "end" });
    return;
  }
  response.innerHTML = `
    <div class="agent-card structured-result">
      <h3>你好</h3>
      <div class="stream-output">
        <section>
          <strong>礼貌问候</strong>
          <ul>
            <li>你好，有什么可以帮您的？</li>
            <li>你可以让我分析客户、查询车辆产品库、生成拜访准备包、整理会议纪要，或直接问通识类问题。</li>
          </ul>
        </section>
      </div>
    </div>
  `;
  stack.appendChild(response);
  attachCardActions(response.querySelector(".agent-card"));
  response.scrollIntoView({ behavior: "smooth", block: "end" });
}

function sendSuggestionTask(text) {
  saveHistory(text);
  addUserMessage(text);
  const stack = ensureStack();
  const response = document.createElement("div");
  response.className = "agent-response";
  response.innerHTML = `
    <div class="thinking-line">我先判断这个销售任务的目标、客户对象和需要调用的数据源，再联网核验公开信息并整理成可执行结论。</div>
    <div class="search-line"><span></span> 正在联网查询公开信息、企业档案、案例库与车辆运力数据...</div>
    <div class="agent-card structured-result" hidden>
      <h3></h3>
      <div class="stream-output"></div>
    </div>
  `;
  stack.appendChild(response);
  response.scrollIntoView({ behavior: "smooth", block: "end" });
  setTimeout(() => streamSuggestionResult(response, text), 900);
}

function streamSuggestionResult(response, text) {
  const card = response.querySelector(".structured-result");
  const output = response.querySelector(".stream-output");
  const search = response.querySelector(".search-line");
  const result = getSuggestionResult(text);
  card.hidden = false;
  card.querySelector("h3").textContent = result.title;
  attachCardActions(card);
  if (result.funnel) {
    output.insertAdjacentHTML("beforeend", buildFunnel(result.funnel));
  }
  if (result.table) {
    output.insertAdjacentHTML("beforeend", buildTaskTable(result.table));
  }
  if (result.vehicleProducts) {
    output.insertAdjacentHTML("beforeend", buildVehicleProductTable(result.vehicleProducts));
  }
  if (result.radar) {
    output.insertAdjacentHTML("beforeend", buildRadar(result.radar));
  }
  let index = 0;
  const blocks = result.sections.map((section) => `
    <section>
      <strong>${section.heading}</strong>
      <ul>${section.items.map((item) => `<li>${item}</li>`).join("")}</ul>
    </section>
  `);
  const timer = setInterval(() => {
    output.insertAdjacentHTML("beforeend", blocks[index]);
    output.lastElementChild.scrollIntoView({ behavior: "smooth", block: "end" });
    index += 1;
    if (index >= blocks.length) {
      clearInterval(timer);
      search.innerHTML = `<span class="done"></span> 联网查询完成，已生成结构化结果。`;
    }
  }, 520);
}

function buildRadar(dimensions) {
  const size = 260;
  const center = size / 2;
  const maxRadius = 86;
  const levels = [0.25, 0.5, 0.75, 1];
  const points = dimensions.map((item, index) => {
    const angle = (Math.PI * 2 * index) / dimensions.length - Math.PI / 2;
    const radius = maxRadius * (item.value / 100);
    return [center + Math.cos(angle) * radius, center + Math.sin(angle) * radius];
  });
  const polygon = points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const axes = dimensions.map((item, index) => {
    const angle = (Math.PI * 2 * index) / dimensions.length - Math.PI / 2;
    const x = center + Math.cos(angle) * maxRadius;
    const y = center + Math.sin(angle) * maxRadius;
    const lx = center + Math.cos(angle) * (maxRadius + 28);
    const ly = center + Math.sin(angle) * (maxRadius + 28);
    return `<line x1="${center}" y1="${center}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}"></line><text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}">${item.label}</text>`;
  }).join("");
  const rings = levels.map((level) => {
    const ringPoints = dimensions.map((_, index) => {
      const angle = (Math.PI * 2 * index) / dimensions.length - Math.PI / 2;
      return `${(center + Math.cos(angle) * maxRadius * level).toFixed(1)},${(center + Math.sin(angle) * maxRadius * level).toFixed(1)}`;
    }).join(" ");
    return `<polygon points="${ringPoints}"></polygon>`;
  }).join("");
  return `
    <section class="radar-section">
      <strong>客户画像雷达图</strong>
      <div class="radar-layout">
        <svg class="radar-chart" viewBox="0 0 ${size} ${size}" role="img" aria-label="客户画像雷达图">
          <g class="radar-rings">${rings}</g>
          <g class="radar-axes">${axes}</g>
          <polygon class="radar-area" points="${polygon}"></polygon>
          ${points.map(([x, y]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.5"></circle>`).join("")}
        </svg>
        <div class="radar-score-list">
          ${dimensions.map((item) => `<div><span>${item.label}</span><b>${item.value}</b></div>`).join("")}
        </div>
      </div>
    </section>`;
}

function buildFunnel(items) {
  return `
    <section class="funnel-overview">
      <strong>销售工作漏斗概览</strong>
      <div class="funnel-grid">
        ${items.map((item) => `
          <div>
            <span>${item.label}</span>
            <b>${item.value}</b>
            <em>${item.note}</em>
          </div>
        `).join("")}
      </div>
    </section>`;
}

function buildTaskTable(rows) {
  return `
    <section class="task-table-section">
      <strong>今日任务表格明细</strong>
      <table class="task-table">
        <thead>
          <tr><th>优先级</th><th>客户/事项</th><th>任务动作</th><th>目标</th><th>状态</th></tr>
        </thead>
        <tbody>
          ${rows.map((row) => `
            <tr>
              <td>${row.level}</td>
              <td>${row.customer}</td>
              <td>${row.action}</td>
              <td>${row.goal}</td>
              <td><span>${row.status}</span></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </section>`;
}

function buildVehicleProductTable(rows) {
  return `
    <section class="vehicle-product-section">
      <strong>可售卖货运车辆产品库</strong>
      <table class="task-table vehicle-product-table">
        <thead>
          <tr><th>车型名称</th><th>品牌</th><th>电池容量</th><th>库存数量</th><th>车辆报价</th></tr>
        </thead>
        <tbody>
          ${rows.map((row) => `
            <tr>
              <td>${row.name}</td>
              <td>${row.brand}</td>
              <td>${row.battery}</td>
              <td>${row.stock}</td>
              <td><span>${row.price}</span></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </section>`;
}

function getSuggestionResult(text) {
  if (text.includes("今日工作任务") || text.includes("今天有哪些工作任务") || text.includes("优先跟进") || text.includes("日历待办")) {
    return {
      title: "今日销售工作任务",
      funnel: [
        { label: "当月新增线索数", value: "128", note: "较上周 +18" },
        { label: "注册货主数", value: "46", note: "转化率 35.9%" },
        { label: "认证货主数", value: "21", note: "待补资料 8" },
        { label: "发货货主数", value: "9", note: "本周目标 12" }
      ],
      table: [
        { level: "P0", customer: "上海恒驰冷链物流有限公司", action: "完成客户360画像并确认车辆规模", goal: "推进拜访", status: "进行中" },
        { level: "P0", customer: "华东冷链车辆机会", action: "补齐线路、车型、预算和发车周期", goal: "发布机会", status: "待确认" },
        { level: "P1", customer: "徐工600度电动牵引车线索", action: "识别KP并确认采购/租赁意向", goal: "转注册", status: "待跟进" },
        { level: "P1", customer: "上海物流企业案例匹配", action: "准备同区域成交案例和话术", goal: "提升转化", status: "已生成" },
        { level: "P2", customer: "车险组合方案", action: "整理保费对比与异议处理", goal: "促认证", status: "待完善" }
      ],
      sections: [
        { heading: "今日优先级建议", items: ["先处理 P0 客户和待确认机会，确保线索向注册/认证推进。", "对认证货主重点补齐资料，对发货货主重点跟进首单发货。"] },
        { heading: "日历待办提醒", items: ["10:30 跟进恒驰冷链车辆规模确认。", "14:00 准备华东冷链机会发布字段。", "16:30 复盘徐工电车商机 KP 和预算信息。"] },
        { heading: "Agent 建议动作", items: ["自动生成恒驰冷链客户360画像。", "对待认证货主生成补资料提醒。", "对已注册未发货货主生成首单激活话术。"] }
      ]
    };
  }
  if (text.includes("拜访")) {
    return {
      title: "客户拜访准备包",
      sections: [
        { heading: "拜访目标", items: ["确认客户车辆规模、线路缺口、保险到期时间和预算周期。", "判断是否适合先推进车险优化，再切入冷链车租赁。"] },
        { heading: "建议提问", items: ["旺季外协车辆成本波动大概在哪个区间？", "当前冷链车辆保险是否集中到期，是否存在降本空间？"] },
        { heading: "下一步动作", items: ["准备华东冷链成交案例。", "拜访后自动生成 CRM 跟进记录和待办。"] }
      ]
    };
  }
  if (text.includes("机会")) {
    return {
      title: "销售机会结构化结果",
      sections: [
        { heading: "已识别字段", items: ["客户：上海恒驰冷链物流有限公司。", "需求：冷链线路运力、车辆租赁、车险优化。"] },
        { heading: "待补充字段", items: ["线路起终点、车辆数量、预算范围、发车周期。"] },
        { heading: "发布建议", items: ["先保存为机会草稿，补齐预算和线路后再发布。"] }
      ]
    };
  }
  if (text.includes("案例")) {
    return {
      title: "成交案例匹配结果",
      sections: [
        { heading: "匹配逻辑", items: ["优先匹配华东区域、冷链物流、车辆规模相近客户。", "重点筛选包含租赁、保险、运力组合的案例。"] },
        { heading: "推荐打法", items: ["用保险降本建立信任。", "再以短周期冷链车租赁试点降低客户决策门槛。"] },
        { heading: "可复用材料", items: ["案例摘要、报价结构、客户异议处理话术。"] }
      ]
    };
  }
  if (text.includes("公司车辆产品库")) {
    return {
      title: "公司车辆产品库查询结果",
      vehicleProducts: [
        { name: "徐工新能源399.36牵引车", brand: "徐工新能源", battery: "399.36kWh", stock: "35", price: "62.00万元" },
        { name: "徐工新能源282牵引车", brand: "徐工新能源", battery: "282kWh", stock: "18", price: "54.80万元" },
        { name: "远程新能源冷链轻卡", brand: "远程新能源", battery: "100.46kWh", stock: "42", price: "19.60万元" },
        { name: "福田智蓝冷藏中卡", brand: "福田智蓝", battery: "162.28kWh", stock: "26", price: "32.80万元" },
        { name: "三一魔塔电动牵引车", brand: "三一新能源", battery: "423kWh", stock: "12", price: "68.50万元" }
      ],
      sections: [
        { heading: "适配场景", items: ["冷链客户优先匹配带温控、续航稳定、维保网络完善的车型。", "若客户有旺季外协需求，可推荐短租/长租组合方案。", "若客户关注成本，可同步测算车险、租赁和能源成本。"] },
        { heading: "销售切入建议", items: ["先确认线路里程、载重、温区、发车频次和现有车型结构。", "再从产品库匹配 2-3 个车型方案，并生成报价/租赁/保险组合。"] }
      ]
    };
  }
  if (text.includes("车辆") || text.includes("运力")) {
    return {
      title: "车辆与运力查询结果",
      sections: [
        { heading: "初步判断", items: ["客户疑似拥有 80-120 台冷链相关车辆。", "旺季外协比例可能偏高，存在弹性运力需求。"] },
        { heading: "销售机会", items: ["新能源冷链车租赁。", "华东线路临时运力补充。", "车辆保险组合优化。"] },
        { heading: "风险提示", items: ["车辆规模为综合推断，需要拜访中确认自有车和外协车比例。"] }
      ]
    };
  }
  if (text.includes("话术") || text.includes("异议")) {
    return {
      title: "销售话术与异议处理",
      sections: [
        { heading: "开场话术", items: ["我们关注到贵司在华东冷链线路上业务增长较快，车辆弹性和旺季履约可能是今年重点。"] },
        { heading: "异议处理", items: ["如果客户担心成本，先展示车险降本测算。", "如果客户担心合作风险，先给同区域试点案例。"] },
        { heading: "推进建议", items: ["先约一次需求确认，再输出小范围试点方案。"] }
      ]
    };
  }
  if (text.includes("CRM") || text.includes("会议")) {
    return {
      title: "CRM更新建议",
      sections: [
        { heading: "跟进摘要", items: ["客户关注车辆成本、旺季运力和保险支出。", "当前适合推进组合型解决方案。"] },
        { heading: "待办事项", items: ["补充车辆规模。", "确认保险到期时间。", "准备同区域案例材料。"] },
        { heading: "写入建议", items: ["生成 CRM 草稿，等待销售确认后写入。"] }
      ]
    };
  }
  return {
    title: "客户洞察分析结果",
    radar: [
      { label: "客户类型匹配", value: 92 },
      { label: "行业优先级", value: 88 },
      { label: "运力规模", value: 78 },
      { label: "车辆资产", value: 74 },
      { label: "金融保险需求", value: 86 },
      { label: "KP可触达", value: 68 },
      { label: "成交潜力", value: 82 },
      { label: "风险可控", value: 72 }
    ],
    sections: [
      { heading: "客户类型与黄金客户判断", items: ["客户归类：物流型企业，疑似冷链运输车队或三方物流客户。", "黄金客户判断：具备高频运输、车辆资产、保险和旺季运力需求，优先级高。", "不建议盲目跟进，应先验证车辆规模、线路稳定性和决策链。"] },
      { heading: "客户图谱", items: ["行业品类：冷链物流，可能服务食品、生鲜、医药等高频刚需场景。", "业务场景：冷链干线、城配、临时运力补充、外协车队管理。", "增长空白：车险优化、冷链车租赁、华东线路运力补位。"] },
      { heading: "联网线索验证路径", items: ["企业信息平台：核验注册资本、经营范围、关联企业和风险。", "招聘平台：搜索司机、调度、物流经理、财务等岗位，判断业务扩张和 KP 线索。", "地图/园区：定位仓库、物流园和停车场，观察车辆类型与上下游流向。", "B2B/招投标：查找公开运输需求、供应链合作和货主来源。"] },
      { heading: "KP 关键人地图", items: ["主 KP：老板、总经理、财务负责人，负责合作、账期和税务合规决策。", "辅 KP：调度负责人，负责线路、车辆、运力匹配。", "信息 KP：车队长、司机、门卫，可帮助了解上下游客户和真实运输场景。"] },
      { heading: "推荐切入策略", items: ["第一步：用车险成本优化或保费对比作为低门槛切入。", "第二步：结合车辆规模与旺季缺口，提出冷链车租赁试点。", "第三步：匹配华东冷链成交案例，推动线路运力服务合作。", "CRM 下一步：记录客户类型、潜在需求、KP 假设和待验证问题。"] }
    ]
  };
}

const favorites = [
  { type: "image", title: "客户聊天截图", meta: "微信需求截图", tone: "blank" },
  { type: "image", title: "恒驰冷链拜访白板", meta: "客户需求梳理", tone: "text" },
  { type: "image", title: "车辆保险题库截图", meta: "培训资料", tone: "qa" },
  { type: "image", title: "Agent知识点截图", meta: "内部学习", tone: "qa" },
  { type: "file", title: "客户360分析报告.docx", meta: "上海恒驰冷链", tone: "file" },
  { type: "file", title: "冷链车租赁方案.pptx", meta: "拜访材料", tone: "file" },
  { type: "image", title: "机会发布字段截图", meta: "线路与车辆需求", tone: "qa" },
  { type: "file", title: "华东冷链案例库.xlsx", meta: "成交案例", tone: "file" }
];

function renderFavoriteView(filter = "all") {
  const visible = favorites.filter((item) => filter === "all" || item.type === filter);
  $("#conversation").innerHTML = `
    <div class="favorite-view">
      <div class="favorite-tabs" role="tablist">
        <button class="${filter === "all" ? "active" : ""}" data-fav-filter="all">全部</button>
        <button class="${filter === "image" ? "active" : ""}" data-fav-filter="image">图片</button>
        <button class="${filter === "file" ? "active" : ""}" data-fav-filter="file">文件</button>
      </div>
      <div class="favorite-grid">
        ${visible.map((item) => `
          <article class="favorite-card ${item.tone}">
            <div class="favorite-thumb">
              ${item.type === "file" ? `<span class="file-badge">${item.title.split(".").pop().toUpperCase()}</span>` : buildImageMock(item.tone)}
            </div>
            <strong>${item.title}</strong>
            <span>${item.meta}</span>
          </article>
        `).join("")}
      </div>
    </div>
  `;
  $$(".favorite-tabs button").forEach((button) => {
    button.addEventListener("click", () => renderFavoriteView(button.dataset.favFilter));
  });
}

function renderObservatoryView(tab = "dashboard") {
  const meta = {
    dashboard: ["销售数据看板", "查看团队销售漏斗、通话、任务和销售人员明细。"],
    quality: ["销售质检", "检查通话质量、跟进规范、话术执行和风险问题。"],
    talent: ["人才报告（销售能力）", "评估销售能力结构、短板和培养建议。"]
  };
  const [title, desc] = meta[tab] || meta.dashboard;
  $("#conversation").innerHTML = `
    <div class="observatory-view">
      <div class="observatory-head">
        <div>
          <span>销售管理后台</span>
          <h2>观星台 · ${title}</h2>
          <p>${desc}</p>
        </div>
        <button class="primary">生成团队日报</button>
      </div>
      ${tab === "dashboard" ? buildSalesDashboard() : ""}
      ${tab === "quality" ? buildQualityDashboard() : ""}
      ${tab === "talent" ? buildTalentDashboard() : ""}
    </div>
  `;
}

function renderKnowledgeView(tab = "cases") {
  const meta = {
    cases: ["优秀销售案例", "沉淀高转化客户打法、成交路径和可复用证明材料。"],
    sop: ["面客话术SOP", "按客户类型、拜访阶段和异议场景组织标准话术。"],
    products: ["公司产品知识", "聚合车险、租赁、运力、金融和物流服务产品知识。"],
    policy: ["最新销售政策", "同步最新销售激励、准入规则、报价政策和审批要求。"]
  };
  const [title, desc] = meta[tab] || meta.cases;
  $("#conversation").innerHTML = `
    <div class="knowledge-view">
      <div class="observatory-head">
        <div>
          <span>知识库</span>
          <h2>${title}</h2>
          <p>${desc}</p>
        </div>
        <button class="primary">让Agent引用</button>
      </div>
      ${tab === "cases" ? buildCaseKnowledge() : ""}
      ${tab === "sop" ? buildSopKnowledge() : ""}
      ${tab === "products" ? buildProductKnowledge() : ""}
      ${tab === "policy" ? buildPolicyKnowledge() : ""}
    </div>
  `;
}

function buildCaseKnowledge() {
  return `
    <div class="knowledge-grid">
      <article class="knowledge-card"><strong>华东冷链车队成交案例</strong><span>车险优化切入，冷链车租赁试点，最终承接线路运力。</span><em>适用：冷链物流 / 车队客户</em></article>
      <article class="knowledge-card"><strong>三方物流降本案例</strong><span>从账期和保险成本切入，建立财务KP信任。</span><em>适用：三方物流 / 财务决策</em></article>
      <article class="knowledge-card"><strong>新能源货车租赁案例</strong><span>通过短周期试点降低采购顾虑，提升认证与首单转化。</span><em>适用：车辆扩充 / 成本敏感</em></article>
    </div>`;
}

function buildSopKnowledge() {
  return `
    <div class="knowledge-grid">
      <article class="knowledge-card"><strong>首次拜访开场</strong><span>先确认客户业务场景，再从车辆、线路、账期、保险四个方向提问。</span><em>阶段：拜访准备</em></article>
      <article class="knowledge-card"><strong>价格异议处理</strong><span>先用总成本口径对齐，再展示同区域案例与分阶段试点方案。</span><em>阶段：方案沟通</em></article>
      <article class="knowledge-card"><strong>KP识别问题清单</strong><span>确认老板、财务、调度、车队长在合作决策中的职责和影响力。</span><em>阶段：需求挖掘</em></article>
    </div>`;
}

function buildProductKnowledge() {
  return `
    <div class="knowledge-grid">
      <article class="knowledge-card"><strong>车险优化</strong><span>适合车辆规模较大、保费高或保险集中到期的客户。</span><em>切入点：降本 / 合规</em></article>
      <article class="knowledge-card"><strong>冷链车租赁</strong><span>适合旺季临时扩车、采购预算受限、线路波动明显的客户。</span><em>切入点：弹性运力</em></article>
      <article class="knowledge-card"><strong>线路运力服务</strong><span>适合存在固定线路、外协成本高、发货稳定的货主或车队。</span><em>切入点：履约稳定</em></article>
    </div>`;
}

function buildPolicyKnowledge() {
  return `
    <div class="knowledge-grid">
      <article class="knowledge-card"><strong>冷链车租赁试点政策</strong><span>针对华东冷链客户，支持 30 天小规模试点，优先覆盖认证货主和高意向车队。</span><em>更新：本月有效</em></article>
      <article class="knowledge-card"><strong>车险组合优惠规则</strong><span>车辆规模 50 台以上客户可申请组合报价，需提交车辆清单与历史保单。</span><em>适用：保险优化切入</em></article>
      <article class="knowledge-card"><strong>机会发布审批要求</strong><span>涉及预算、线路和车辆数量的机会，发布前需完成字段校验和销售经理确认。</span><em>治理：人工审批</em></article>
    </div>`;
}

function buildSalesDashboard() {
  return `
      <div class="observatory-grid">
        <section class="metric-card"><span>跟进线索总数</span><strong>430</strong><em>合规总数 358</em></section>
        <section class="metric-card"><span>电话平均时长</span><strong>1'11"</strong><em>线下平均 1'2"</em></section>
        <section class="metric-card"><span>任务完成率</span><strong>96%</strong><em>遗漏率 4.3%</em></section>
        <section class="metric-card"><span>任务总数</span><strong>320</strong><em>完成数量 296</em></section>
        <section class="metric-card"><span>开场白执行率</span><strong>92%</strong><em>收集客户 88%</em></section>
        <section class="metric-card"><span>违规线索数</span><strong>85</strong><em>需质检复盘</em></section>
      </div>
      <div class="observatory-panels">
        <section class="agent-card">
          <h3>销售列表</h3>
          <table class="task-table">
            <thead><tr><th>销售人员</th><th>合规总数</th><th>平均时长</th><th>任务总数</th><th>完成数量</th><th>质检评分</th><th>沟通技巧</th><th>综合评分</th></tr></thead>
            <tbody>
              <tr><td>晨乐</td><td>120</td><td>1'1"</td><td>70</td><td>60</td><td>92</td><td>80</td><td><span>85</span></td></tr>
              <tr><td>小马哥</td><td>96</td><td>1'20"</td><td>92</td><td>89</td><td>90</td><td>85</td><td><span>86</span></td></tr>
              <tr><td>雪村娃</td><td>88</td><td>1'05"</td><td>85</td><td>82</td><td>85</td><td>75</td><td><span>84</span></td></tr>
              <tr><td>公羊骑方</td><td>70</td><td>1'22"</td><td>82</td><td>70</td><td>75</td><td>72</td><td><span>82</span></td></tr>
            </tbody>
          </table>
        </section>
        <section class="agent-card">
          <h3>风险商机预警</h3>
          <div class="risk-list">
            <div><strong>7天未跟进</strong><span>4 个商机需要销售经理介入</span></div>
            <div><strong>认证资料缺失</strong><span>8 个货主停留在认证前</span></div>
            <div><strong>首单未激活</strong><span>12 个注册货主未形成发货</span></div>
          </div>
        </section>
      </div>
    `;
}

function buildQualityDashboard() {
  return `
    <div class="observatory-grid">
      <section class="metric-card"><span>抽检通话</span><strong>85</strong><em>今日新增 12</em></section>
      <section class="metric-card"><span>合规率</span><strong>88%</strong><em>较昨日 +3%</em></section>
      <section class="metric-card"><span>高风险话术</span><strong>9</strong><em>需复盘</em></section>
      <section class="metric-card"><span>优秀样本</span><strong>18</strong><em>可沉淀话术</em></section>
    </div>
    <section class="agent-card">
      <h3>质检问题列表</h3>
      <table class="task-table">
        <thead><tr><th>销售</th><th>客户</th><th>质检问题</th><th>建议动作</th><th>状态</th></tr></thead>
        <tbody>
          <tr><td>晨乐</td><td>恒驰冷链</td><td>未确认KP角色</td><td>补问财务/调度决策链</td><td><span>待复盘</span></td></tr>
          <tr><td>小马哥</td><td>华东车队</td><td>异议处理不完整</td><td>补充成本对比话术</td><td><span>处理中</span></td></tr>
          <tr><td>雪村娃</td><td>冷链货主</td><td>未明确下一步时间</td><td>生成跟进提醒</td><td><span>待跟进</span></td></tr>
        </tbody>
      </table>
    </section>`;
}

function buildTalentDashboard() {
  return `
    <div class="observatory-grid">
      <section class="metric-card"><span>客户洞察能力</span><strong>86</strong><em>团队均分</em></section>
      <section class="metric-card"><span>需求挖掘能力</span><strong>82</strong><em>短板项</em></section>
      <section class="metric-card"><span>异议处理能力</span><strong>79</strong><em>需训练</em></section>
      <section class="metric-card"><span>CRM规范度</span><strong>91</strong><em>表现稳定</em></section>
    </div>
    <section class="agent-card">
      <h3>销售能力报告</h3>
      <div class="risk-list">
        <div><strong>N小姐</strong><span>客户洞察强，建议加强成交推进和预算确认。</span></div>
        <div><strong>晨乐</strong><span>通话完成率高，建议训练KP识别和异议追问。</span></div>
        <div><strong>小马哥</strong><span>任务完成率高，适合作为冷链案例打法共创人。</span></div>
      </div>
    </section>`;
}

function buildImageMock(tone) {
  if (tone === "blank") return `<div class="mock-blank"></div>`;
  if (tone === "text") return `<div class="mock-text"><b>构建一个通用技术系统</b><i></i><i></i></div>`;
  return `
    <div class="mock-qa">
      <p>15. Agent技术在售后、供应链及企业管理等领域具有显著价值。</p>
      <label>○ 正确</label>
      <label>○ 错误</label>
      <p>16. 智能风控模型仅依赖企业内部数据进行信用评估。</p>
      <label>○ 正确</label>
      <label>○ 错误</label>
    </div>`;
}

function bindSuggestions() {
  $$(".suggestions button").forEach((button) => {
    button.addEventListener("click", () => {
      const text = button.textContent.trim();
      sendSuggestionTask(text);
    });
  });
}

function getRecentConversations() {
  return $$("#historyList button").map((button, index) => ({
    title: button.textContent.trim(),
    time: index === 0 ? "刚刚" : index === 1 ? "18:19" : index === 2 ? "15:04" : index === 3 ? "昨天 08:06" : "6月18日",
    source: button
  }));
}

function renderRecentList(keyword = "") {
  const list = $("#recentList");
  if (!list) return;
  const normalized = keyword.trim().toLowerCase();
  const items = getRecentConversations().filter((item) => !normalized || item.title.toLowerCase().includes(normalized));
  list.innerHTML = items.map((item, index) => `
    <button data-recent-index="${index}">
      <span>◌</span>
      <strong>${item.title}</strong>
      <time>${item.time}</time>
    </button>
  `).join("") || `<button disabled><span>⌕</span><strong>没有匹配的最近对话</strong><time></time></button>`;
  $$("#recentList button[data-recent-index]").forEach((button) => {
    button.addEventListener("click", () => {
      const selected = items[Number(button.dataset.recentIndex)];
      closeSearchModal();
      restoreHistoryConversation(selected.title, selected.source);
    });
  });
}

function openSearchModal() {
  renderRecentList();
  $("#searchModal").hidden = false;
  $("#searchInput").value = "";
  setTimeout(() => $("#searchInput").focus(), 40);
}

function closeSearchModal() {
  $("#searchModal").hidden = true;
}

bindSuggestions();

$$("#historyList button").forEach(bindHistoryButton);

$$("[data-template]").forEach((button) => {
  button.addEventListener("click", () => {
    const text = button.dataset.template;
    setPrompt(text);
  });
});

$("#openSearch").addEventListener("click", openSearchModal);
$("#searchInput").addEventListener("input", (event) => renderRecentList(event.target.value));
$("#modalNewChat").addEventListener("click", () => {
  closeSearchModal();
  $('.nav-btn[data-mode="new"]').click();
});
$$("[data-close-search]").forEach((node) => node.addEventListener("click", closeSearchModal));
document.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    openSearchModal();
  }
  if (event.key === "Escape" && !$("#searchModal").hidden) {
    closeSearchModal();
  }
});

$$(".nav-btn").forEach((button) => {
  button.addEventListener("click", () => {
    $$(".nav-btn").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    if (button.dataset.mode !== "knowledge") $(".knowledge-sub-nav")?.classList.remove("open");
    if (button.dataset.mode !== "observatory") $(".observatory-sub-nav")?.classList.remove("open");
    const labels = {
      new: "新对话",
      knowledge: "知识库",
      favorite: "收藏",
      observatory: "观星台",
      history: "历史对话"
    };
    $("#chatTitle").textContent = labels[button.dataset.mode] || "新对话";
    if (button.dataset.mode === "new") {
      $("#conversation").innerHTML = `
        <div class="empty-state" id="emptyState">
          <h1>有什么我能帮你的？</h1>
          <div class="suggestions">
            <button>帮我分析上海恒驰冷链物流有限公司</button>
            <button>今日工作任务</button>
            <button>生成明天下午客户拜访准备包</button>
            <button>把客户需求结构化为销售机会</button>
            <button>匹配同行业同区域成交案例</button>
            <button>查询客户车辆与运力规模</button>
            <button>查询公司车辆产品库</button>
            <button>生成销售话术和异议处理</button>
            <button>开启会议总结更新CRM记录</button>
            <button>预测这个商机的成交风险</button>
          </div>
        </div>`;
      bindSuggestions();
      toast("已创建新会话。发送任务后会自动保存到历史对话。");
    } else if (button.dataset.mode === "favorite") {
      renderFavoriteView();
    } else if (button.dataset.mode === "knowledge") {
      $(".knowledge-sub-nav")?.classList.toggle("open");
      setKnowledgeTab("cases");
    } else if (button.dataset.mode === "observatory") {
      $(".observatory-sub-nav")?.classList.toggle("open");
      setObservatoryTab("dashboard");
    } else {
      toast(`${labels[button.dataset.mode]} 将作为 AI 能力面板打开。`);
    }
  });
});

function setKnowledgeTab(tab) {
  $(".knowledge-sub-nav")?.classList.add("open");
  $$(".knowledge-sub-nav button").forEach((item) => item.classList.toggle("active", item.dataset.knowledge === tab));
  renderKnowledgeView(tab);
}

$$(".knowledge-sub-nav button").forEach((button) => {
  button.addEventListener("click", () => {
    $$(".nav-btn").forEach((item) => item.classList.remove("active"));
    const parent = $('.nav-btn[data-mode="knowledge"]');
    parent?.classList.add("active");
    $("#chatTitle").textContent = button.textContent.trim();
    setKnowledgeTab(button.dataset.knowledge);
  });
});

function setObservatoryTab(tab) {
  $(".observatory-sub-nav")?.classList.add("open");
  $$(".sub-nav button").forEach((item) => {
    if (item.dataset.observatory) item.classList.toggle("active", item.dataset.observatory === tab);
  });
  renderObservatoryView(tab);
}

$$(".sub-nav button").forEach((button) => {
  button.addEventListener("click", () => {
    $$(".nav-btn").forEach((item) => item.classList.remove("active"));
    const parent = $('.nav-btn[data-mode="observatory"]');
    parent?.classList.add("active");
    $("#chatTitle").textContent = button.textContent.trim();
    setObservatoryTab(button.dataset.observatory);
  });
});

$(".top-left .top-icon").addEventListener("click", () => {
  document.body.classList.toggle("rail-collapsed");
  toast("侧边栏状态已切换。");
});

$("#sendBtn").addEventListener("click", sendTask);
$("#promptInput").addEventListener("input", resizeInput);
$("#promptInput").addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendTask();
  }
});

$(".plus").addEventListener("click", (event) => {
  event.stopPropagation();
  $("#attachMenu").hidden = !$("#attachMenu").hidden;
});
$$("#attachMenu button").forEach((button) => {
  button.addEventListener("click", () => {
    $("#attachMenu").hidden = true;
    const message = button.dataset.attachAction === "album"
      ? "已打开相册，可选择客户截图、名片或现场照片。"
      : "已打开上传入口，可上传文件、图片、Excel、PDF 或会议录音。";
    toast(message);
  });
});
document.addEventListener("click", (event) => {
  if (!event.target.closest(".attach-menu") && !event.target.closest(".plus")) {
    $("#attachMenu").hidden = true;
  }
});
$(".voice-input").addEventListener("click", () => {
  $("#attachMenu").hidden = true;
  $("#voicePanel").hidden = false;
  toast("正在听写，请说出客户名称或销售任务。");
});
$("#voiceCancel").addEventListener("click", () => {
  $("#voicePanel").hidden = true;
  toast("已取消语音输入。");
});
$("#voiceSubmit").addEventListener("click", () => {
  const text = "帮我分析上海恒驰冷链物流有限公司，生成360客户画像";
  $("#voicePanel").hidden = true;
  setPrompt(text);
  sendSuggestionTask(text);
});
$(".more-mode").addEventListener("click", () => toast("更多 Agent：商机评分、车辆查询、线索归属、Browser Agent、File Agent。"));
$(".mini-send").addEventListener("click", sendTask);
$(".voice-entry").addEventListener("click", () => toast("AI语音助手已准备，可用于语音拜访、会议纪要和客户跟进。"));
$(".voice-assistant-top").addEventListener("click", () => toast("AI语音助手：开启后为您实时智能总结通话，挖掘客户需求、下一步话术提醒。"));
$(".message-center-toggle").addEventListener("click", (event) => {
  event.stopPropagation();
  const panel = $("#messageCenter");
  panel.hidden = !panel.hidden;
  if (!panel.hidden) {
    unreadMessages = 0;
    updateMessageBadge();
    renderMessages();
  }
});
$("#closeMessageCenter").addEventListener("click", () => {
  $("#messageCenter").hidden = true;
});
document.addEventListener("click", (event) => {
  if (!event.target.closest(".message-center") && !event.target.closest(".message-center-toggle")) {
    $("#messageCenter").hidden = true;
  }
});

renderMessages();
updateMessageBadge();

setTimeout(() => {
  pushAgentMessage({
    type: "risk",
    icon: "!",
    title: "商机风险预警",
    body: "「上海慧星冷链有限公司」新增一条工商高风险预警，请关注～",
    time: "1分钟前"
  });
}, 60000);

setTimeout(() => {
  pushAgentMessage({
    type: "timeout",
    icon: "⏱",
    title: "跟进超时",
    body: "原计划6.19日跟进客户「成都德华汽贸有限公司」已超时1天，请及时跟进。",
    time: "3分钟前"
  });
  pushAgentMessage({
    type: "dynamic",
    icon: "↗",
    title: "客户动态提醒",
    body: "「上海恒驰冷链物流有限公司」新增冷链调度招聘信息，建议判断是否存在新增线路与车辆需求。",
    time: "3分钟前"
  });
}, 180000);
