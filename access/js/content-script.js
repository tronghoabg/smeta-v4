window.addEventListener("load", function () {
  var linkElement = document.createElement("link");
  linkElement.rel = "stylesheet";
  linkElement.href = chrome.runtime.getURL("access/css/fontawesome.css");
  document.head.appendChild(linkElement);

  main();
});

chrome.runtime.onMessage.addListener(async function (
  request,
  sender,
  sendResponse
) {
  if (request.message === "message") {
    if (
      request.url.includes("billing_hub/payment_settings") ||
      request.url.includes("billing_hub/accounts/details")
    ) {
      var act = "";
      if (request.url.includes("act=") || request.url.includes("asset_id=")) {
        try {
          act = request.url.split("act=")[1].split("&")[0];
        } catch (error) {
          act = request.url.split("asset_id=")[1].split("&")[0];
        }
      }
      var token = await getToken();
      let obj = await getAdAccountInfo(token, act);
      var checkTheThing = setInterval(function () {
        sildeBilding = document.getElementsByClassName(
          "xeuugli x2lwn1j x78zum5 xdt5ytf x1iyjqo2 x2lah0s xozqiw3 x1kxxb1g xxc7z9f x1cvmir6"
        )[0];
        firstChild = sildeBilding.firstChild;
        flag = firstChild.innerText;
        if (flag !== "") {
          smetaBilling(obj);
          clearInterval(checkTheThing);
        }
      }, 10);
    }
  }
});
window.onload = function () {
  setTimeout(autoClose, 15000);
};

async function reqAPI(url, method, body, mode) {
  let response = await fetch(url, {
    method: method,
    credentials: "include",
    body: body,
    mode: mode,
    headers: {
      referer: "https://business.facebook.com/adsmanager/manage/accounts",
    },
  });
  let html = await response.text().then((res) => res);
  return html;
}

async function main() {
  var url = window.location.href;
  if (url.includes("business.facebook.com/settings/")) {
    bm = url.split("business_id=")[1];
    document.title = "BM:  " + bm + " | sMeta.vn";
  }
  if (url.includes("/ads/manager/accounts/")) {
    return;
  }
  var flag = url.includes("act=");
  var act = "";
  if (url.includes("act=") || url.includes("asset_id=")) {
    try {
      act = url.split("act=")[1].split("&")[0];
    } catch (error) {
      act = url.split("asset_id=")[1].split("&")[0];
    }
    document.title = act + " | sMeta.vn";
    if (url.includes("billing_hub") || url.includes("billing_history")) {
      document.title = "Bill " + act + " | sMeta.vn";
    }
    if (url.includes("campaigns")) {
      document.title = "Camp " + act + " | sMeta.vn";
    }
    var token = await getToken();

    let obj = await getAdAccountInfo(token, act);
    smetaPopUp(obj, url, act);
    if (
      url.includes("billing_hub/payment_settings") ||
      url.includes("billing_hub/accounts/details")
    ) {
      smetaBilling(obj);
    }
  }
}

async function getToken() {
  var html_src = document.documentElement.outerHTML;
  regex = /"EA[A-Za-z0-9]{20,}/gm;
  match = html_src.match(regex);
  var token = "";
  var fbdt = "";
  try {
    token = match[0].substr(1);
    fbdt = html_src.split('["DTSGInitData",[],{"token":"')[1].split('"')[0];
  } catch (error) {}

  obj = {
    token: token,
    fbdt: fbdt,
  };
  return obj;
}

async function getNewLimit(fbdt, act) {
  var origin = window.location.origin;
  var url = `${origin}/api/graphql`;
  let formData = new FormData();

  formData.append("fb_dtsg", fbdt);
  formData.append("doc_id", "6401661393282937");
  formData.append("variables", `{"assetID":${act}}`);
  let res = await reqAPI(url, "POST", formData);
  try {
    let formatted_dsl = res.split('"formatted_dsl":"')[1].split('",')[0];
    var newlimit = formatted_dsl
      .replace(/\\u[\dA-Fa-f]{4}/g, "")
      .replace(/[^\d]/g, "");
    return Number(newlimit);
  } catch (error) {
    return "-";
  }
}

async function getAdAccountInfo(token, act) {
  var html_src = document.documentElement.outerHTML;
  var user_id = html_src.split('personal_user_id":"')[1].split('"')[0];
  let url = `https://graph.facebook.com/v15.0/act_${act}?fields=business,owner_business,name,account_id,disable_reason,account_status,currency,adspaymentcycle,adtrust_dsl,balance,amount_spent,account_currency_ratio_to_usd,users,all_payment_methods{pm_credit_card{display_string,exp_month,exp_year,is_verified}},created_time,next_bill_date,timezone_name,timezone_offset_hours_utc,insights.date_preset(maximum){spend},userpermissions,owner,is_prepay_account&summary=true&access_token=${token.token}`;
  let json = await reqAPI(url, "GET");
  let obj = JSON.parse(json);
  var objAcc = {
    s_status: "",
    s_id: "null",
    s_name: "",
    s_balance: "",
    s_threshold: "*",
    s_adtrust: "",
    s_adtrust_new: "",
    s_spent: "",
    s_admin: "",
    s_currency: "",
    s_acctype: "",
    s_card: "",
    s_created_time: "",
    s_timezone: "",
    s_role: "",
    h_balance: "",
    h_threshold: "*",
    h_adtrust: "",
    h_adtrust_new: "",
    h_spent: "",
    h_bm: "",
  };

  usd_rate = obj.account_currency_ratio_to_usd;
  objAcc.s_status = getStatusAcc(obj.account_status);
  objAcc.s_id = obj.account_id;
  objAcc.s_name = obj.name;
  objAcc.s_balance = coverCurrency(obj.balance, obj.currency);
  if (obj.adspaymentcycle) {
    let threshold = obj.adspaymentcycle.data[0].threshold_amount;
    threshold = coverCurrency(threshold, obj.currency);
    objAcc.s_threshold = threshold;
  } else {
    objAcc.s_threshold = "-";
  }
  objAcc.s_adtrust =
    obj.adtrust_dsl == -1
      ? "No limit"
      : coverCurrency(obj.adtrust_dsl, "round");
  let newlimit = await getNewLimit(token.fbdt, act);
  objAcc.s_adtrust_new = coverCurrency(newlimit, obj.currency);
  let spend = obj.insights ? obj.insights.data[0].spend : 0;

  objAcc.s_spent = coverCurrency(spend, "round");

  objAcc.s_currency = obj.currency;
  if (!obj.business) {
    objAcc.s_acctype = "Cá nhân";
  } else {
    objAcc.s_acctype = "Doanh Nghiệp";
  }
  var card = "";
  if (obj.iprepay_account) {
    card = "Trả Trước";
  } else if (obj.all_payment_methods) {
    var cardInfo = obj.all_payment_methods.pm_credit_card.data[0];
    card = `${cardInfo.display_string} (${cardInfo.exp_month}/${cardInfo.exp_year})`;
  }
  objAcc.s_card = card;
  objAcc.s_created_time = obj.created_time.slice(0, 10);
  objAcc.s_timezone = `${obj.timezone_offset_hours_utc} | ${obj.timezone_name}`;
  var objRole = obj.userpermissions ? obj.userpermissions.data : [];
  objAcc.s_admin = objRole.length;
  var role = "Không xác định";
  for (var member of objRole) {
    var id = member.user ? member.user.id : "none";
    if (id == user_id) {
      switch (member.role) {
        case "ADMIN":
          role = "Quản trị viên";
          break;
        case "REPORTS_ONLY":
          role = "Nhà phân tích";
          break;
        case "GENERAL_USER":
          role = "Nhà quảng cáo";
          break;
        default:
          role = member.role;
      }
      break;
    }
  }
  objAcc.s_role = role;
  objAcc.h_balance = coverCurrency(objAcc.s_balance / usd_rate, "round");
  objAcc.h_threshold = !isNaN(objAcc.s_threshold)
    ? coverCurrency(objAcc.s_threshold / usd_rate, "round")
    : "-";
  objAcc.h_adtrust =
    objAcc.s_adtrust != "No limit"
      ? coverCurrency(objAcc.s_adtrust / usd_rate, "round")
      : "No Limit";
  objAcc.h_adtrust_new =
    objAcc.s_adtrust_new != "-"
      ? coverCurrency(objAcc.s_adtrust_new / usd_rate, "round")
      : "-";
  objAcc.h_spent = coverCurrency(objAcc.s_spent / usd_rate, "round");
  objAcc.h_bm = obj.business ? obj.business.id : "-";
  return objAcc;
}

function autoClose() {
  let ftable = document.querySelector("#fmain");
  ftable.style.opacity = 0;
  ftable.style.visibility = "hidden";
  ftable.style.width = "0";
}

function fadeOutEffect(id) {
  var fadeTarget = document.getElementById(id);
  var fadeEffect = setInterval(function () {
    if (!fadeTarget.style.opacity) {
      fadeTarget.style.opacity = 1;
    }
    if (fadeTarget.style.opacity > 0) {
      fadeTarget.style.opacity -= 0.1;
      fadeTarget.style.visibility = "hidden";
    } else {
      clearInterval(fadeEffect);
    }
  }, 150);
}

var objBillName = {
  s_status: '<i class="fa-solid fa-signal"></i> Trạng Thái',
  s_id: '<i class="fa-regular fa-id-card"></i> ID',
  s_name: '<i class="fa-solid fa-user"></i> Tên TK',
  s_balance: '<i class="fa-solid fa-wallet"></i> Dư nợ',
  s_threshold: '<i class="fa-solid fa-ruler-horizontal"></i> Ngưỡng',
  s_adtrust: '<i class="fa-solid fa-gauge-simple-high"></i> Limit ngày',
  s_adtrust_new: '<i class="fa-solid fa-gauge-high"></i> Limit ',
  s_spent: '<i class="fa-solid fa-dollar-sign"></i> Chi tiêu',
  s_admin: '<i class="fa-solid fa-user-shield"></i> Admin',
  s_currency: '<i class="fa-solid fa-dollar-sign"></i> Tiền tệ',
  s_acctype: '<i class="fa-solid fa-user-tie"></i> Loại TK',
  s_card: `<i class="fa-solid fa-credit-card"></i> Thẻ`,
  s_created_time: '<i class="fa-regular fa-calendar"></i> Ngày tạo',
  s_timezone: '<i class="fa-solid fa-earth-americas"></i> Múi giờ',
  s_role: '<i class="fa-solid fa-user-gear"></i> Quyền',
};

async function smetaBilling(obj) {
  let html = `
                <div class="x1gzqxud x1lq5wgf xgqcy7u x30kzoy x9jhf4c x1kmqopl x5yr21d xh8yej3">
                    <div class="smeta-main">
                    <div class="header">
                        <img src=${chrome.runtime.getURL(
                          "access/icon/logo.png"
                        )} alt="sMeta">
                    </div>
                    <ul class="list" id="smeta-billing-list">
                    </ul>
                    <div class="smeta-billing-footer">
                    </div>
                    </div>
                </div>
`;
  var sildeBilding = document.getElementsByClassName(
    "xeuugli x2lwn1j x78zum5 xdt5ytf x1iyjqo2 x2lah0s xozqiw3 x1kxxb1g xxc7z9f x1cvmir6"
  )[0];
  firstChild = sildeBilding.firstChild;
  firstChild.insertAdjacentHTML("afterend", html);
  sildeBilding.innerHTML = `
        <div class="xeuugli x2lwn1j x78zum5 xdt5ytf x1iyjqo2 x2lah0s xozqiw3 x1kxxb1g xxc7z9f x1cvmir6 smeta_fixed">
            ${sildeBilding.innerHTML}
        </div>
    `;
  let list = document.getElementById("smeta-billing-list");
  var tempHTML = "";
  for (var info in obj) {
    var type_currency = obj.s_currency;
    if (info.slice(0, 2) == "s_") {
      switch (info) {
        case "s_balance":
          tempHTML += `<li><p>${objBillName[info]}</p><div><span id='r'>${obj[
            info
          ].toLocaleString("en-US")} ${
            isNaN(obj[info]) ? "" : type_currency
          }</span><span id='g'>${obj["h_balance"]} ${
            isNaN(obj[info]) ? "" : "$"
          }</span></div></li>`;
          break;
        case "s_adtrust_new":
          tempHTML += `<li><p>${objBillName[info]}</p><div><span id='p'>${obj[
            info
          ].toLocaleString("en-US")} ${
            isNaN(obj[info]) ? "" : type_currency
          }</span><span id='g'>${obj["h_adtrust_new"]} ${
            isNaN(obj[info]) ? "" : "$"
          }</span></div></li>`;
          break;
        case "s_adtrust":
          tempHTML += `<li><p>${objBillName[info]}</p><div><span id='r'>${obj[
            info
          ].toLocaleString("en-US")} ${
            isNaN(obj[info]) ? "" : type_currency
          }</span><span id='g'>${obj["h_adtrust"]} ${
            isNaN(obj[info]) ? "" : "$"
          }</span></div></li>`;
          break;
        case "s_spent":
          tempHTML += `<li><p>${objBillName[info]}</p><div><span id='r'>${obj[
            info
          ].toLocaleString("en-US")} ${
            isNaN(obj[info]) ? "" : type_currency
          }</span><span id='g'>${obj["h_spent"]} ${
            isNaN(obj[info]) ? "" : "$"
          }</span></div></li>`;
          break;
        case "s_threshold":
          tempHTML += `<li><p>${objBillName[info]}</p><div><span id='r'>${obj[
            info
          ].toLocaleString("en-US")} ${
            isNaN(obj[info]) ? "" : type_currency
          }</span><span id='g'>${obj["h_threshold"]} ${
            isNaN(obj[info]) ? "" : "$"
          }</span></div></li>`;
          break;
        default:
          tempHTML += `<li><p>${objBillName[info]}</p><p>${obj[info]}</p></li>`;
      }
    }
    list.innerHTML = tempHTML;
  }
}

async function smetaPopUp(obj, url, act) {
  let html = `
    <div id="smeta">
        <img class ="flogo"  src=${chrome.runtime.getURL(
          "access/icon/128.png"
        )} alt="sMeta">
        </div>
        <div class="main preloading" id="fmain">
            <div id="load">
            <img src=${chrome.runtime.getURL("access/icon/loading.gif")}>
        </div>
        <div class="header">
            <img src=${chrome.runtime.getURL(
              "access/icon/logo.png"
            )} alt="sMeta">
            <img id="fclose" src=${chrome.runtime.getURL(
              "access/icon/close.png"
            )} alt="X">
        </div>
        <ul class="list" id="list-show">
        </ul>
        <div class="s-footer">
        </div>
    </div>
`;
  let wrapperObj = document.querySelector("body>div");
  wrapperObj.insertAdjacentHTML("beforeend", html);
  let btnShow = document.querySelector("#smeta");
  let btnClose = document.querySelector("#fclose");
  let ftable = document.querySelector("#fmain");
  let list = document.getElementById("list-show");

  var tempHTML = "";
  for (var info in obj) {
    var type_currency = obj.s_currency;
    if (info.slice(0, 2) == "s_") {
      switch (info) {
        case "s_balance":
          tempHTML += `<li><p>${objBillName[info]}</p><div><span id='r'>${obj[
            info
          ].toLocaleString("en-US")} ${
            isNaN(obj[info]) ? "" : type_currency
          }</span><span id='g'>${obj["h_balance"]} ${
            isNaN(obj[info]) ? "" : "$"
          }</span></div></li>`;
          break;
        case "s_adtrust":
          tempHTML += `<li><p>${objBillName[info]}</p><div><span id='r'>${obj[
            info
          ].toLocaleString("en-US")} ${
            isNaN(obj[info]) ? "" : type_currency
          }</span><span id='g'>${obj["h_adtrust"]} ${
            isNaN(obj[info]) ? "" : "$"
          }</span></div></li>`;
          break;
        case "s_adtrust_new":
          tempHTML += `<li><p>${objBillName[info]}</p><div><span id='p'>${obj[
            info
          ].toLocaleString("en-US")} ${
            isNaN(obj[info]) ? "" : type_currency
          }</span><span id='g'>${obj["h_adtrust_new"]} ${
            isNaN(obj[info]) ? "" : "$"
          }</span></div></li>`;
          break;
        case "s_spent":
          tempHTML += `<li><p>${objBillName[info]}</p><div><span id='r'>${obj[
            info
          ].toLocaleString("en-US")} ${
            isNaN(obj[info]) ? "" : type_currency
          }</span><span id='g'>${obj["h_spent"]} ${
            isNaN(obj[info]) ? "" : "$"
          }</span></div></li>`;
          break;
        case "s_threshold":
          tempHTML += `<li><p>${objBillName[info]}</p><div><span id='r'>${obj[
            info
          ].toLocaleString("en-US")} ${
            isNaN(obj[info]) ? "" : type_currency
          }</span><span id='g'>${obj["h_threshold"]} ${
            isNaN(obj[info]) ? "" : "$"
          }</span></div></li>`;
          break;
        default:
          tempHTML += `<li><p>${objBillName[info]}</p><p>${obj[info]}</p></li>`;
      }
    }
    list.innerHTML = tempHTML;
    fadeOutEffect("load");
  }
  let footer = document.getElementsByClassName("s-footer")[0];
  footer.innerHTML = `
    <a class="link-ads" title="Tới trang quản lý chiến dịch" href="https://business.facebook.com/adsmanager/manage/campaigns?act=${obj.s_id}"><span>Ads</span></a>
    <a class="link-ads"  title="Tới trang thanh toán" href="https://business.facebook.com/ads/manager/account_settings/account_billing/?act=${obj.s_id}" ><span>Bill</span></a>
    </td>`;
  let flag = url.includes("adsmanager/manage");
  let role = await chrome.storage.local.get("role");
  if (flag && role.role <= 3) {
    footer.innerHTML += `<div class="link-ads" id="rule"  title="Tạo rules" ><span>Rule</span></div>`;
    document.getElementById("rule").addEventListener("click", () => {
      initRule(act);
    });
  }
  let isDragging = false;
  window.flag = false;
  let dragStartX, dragStartY;
  btnShow.addEventListener("mousedown", function (event) {
    isDragging = true;
    dragStartX = event.clientX - btnShow.offsetLeft;
    dragStartY = event.clientY - btnShow.offsetTop;
  });
  document.addEventListener("mousemove", function (event) {
    if (isDragging) {
      const newPosX = event.clientX - dragStartX;
      const newPosY = event.clientY - dragStartY;
      btnShow.style.left = newPosX + "px";
      btnShow.style.top = newPosY + "px";
      btnShow.style.cursor = "grabbing";
    }
  });

  document.addEventListener("mouseup", function () {
    btnShow.style.cursor = "pointer";
    isDragging = false;
  });

  btnShow.addEventListener("click", function (event) {
    if (isDragging) {
      event.preventDefault();
      event.stopPropagation();
    } else {
      flag = ftable.style.opacity;
      if (flag == 1) {
        ftable.style.opacity = 0;
        ftable.style.visibility = "hidden";
        ftable.style.width = "0";
      } else {
        ftable.style.opacity = 1;
        ftable.style.visibility = "visible";
        ftable.style.width = "300px";
      }
    }
  });

  btnClose.onclick = function () {
    ftable.style.opacity = 0;
    ftable.style.visibility = "hidden";
    ftable.style.width = "0";
  };
}

async function initRule(act) {
  let tempLocal = await chrome.storage.local.get(["token", "fbdt"]);
  let token = tempLocal.token;
  let fbdt = tempLocal.fbdt;
  var url = window.location.href;
  var flag = url.includes("selected_campaign_ids");
  var orgin = url.split(".facebook.com")[0];

  if (flag) {
    let camp_id = url.split("selected_campaign_ids=")[1];
    camp_id = camp_id.split("%2C")[0];
    camp_id = camp_id.split("&")[0];
    let urlres = `${orgin}.facebook.com/ads/manager/post_all_adaccount_notifications/?ad_account_id=${act}&is_adaccount_notifications_enabled=false`;
    let formdata = new FormData();
    formdata.append("__a", "1");
    formdata.append("fb_dtsg", fbdt);
    let res = await reqAPI(urlres, "POST", formdata, "no-cors");
    alertGreen("Đã tắt thông báo tài khoản quảng cáo", 3000);
    createRule(act, camp_id);
  } else {
    alert("Vui lòng chọn một chiến dịch cần camp");
    return;
  }
}

async function createRule(act, id) {
  const TRIGGER_RULE = ["CAMPAIGN", "ADSET", "AD"];
  var fetches = [];
  for (var trig of TRIGGER_RULE) {
    var objRule = {
      name: "sMT",
      evaluation_spec: JSON.stringify({
        evaluation_type: "SCHEDULE",
        filters: [
          {
            field: "campaign.id",
            operator: "IN",
            value: [id],
          },
          {
            field: "entity_type",
            operator: "EQUAL",
            value: trig,
          },
          {
            field: "time_preset",
            value: "MAXIMUM",
            operator: "EQUAL",
          },
        ],
      }),
      execution_spec: JSON.stringify({
        execution_type: "UNPAUSE",
      }),
      schedule_spec: JSON.stringify({
        schedule_type: "DAILY",
      }),
    };
    var formData = new FormData();
    Object.keys(objRule).forEach((key) => formData.append(key, objRule[key]));
    fetches.push(pushRule(act, trig, formData));
  }
  var arrs = await Promise.all(fetches).then(function (text) {
    return text;
  });
  alertGreen(`${arrs.join("\n")} `, 3000);
  return;
}

async function pushRule(act, trig, formData) {
  var resText = "";
  var objTemp = await chrome.storage.local.get("token");
  var token = objTemp.token;
  let url = `https://graph.facebook.com/v16.0/act_${act}/adrules_library?access_token=${token}`;

  let res = await reqAPI(url, "POST", formData);
  let json = JSON.parse(res);
  if ("error" in json) {
    resText = `${trig}: ${json.error.message}`;
  } else {
    resText = `${trig}: Done`;
  }
  return resText;
}

function coverCurrency(num, currency) {
  num = +num;
  if (currency == "round") {
    return Math.round((num + Number.EPSILON) * 10) / 10;
  }
  let arr = [
    "CLP",
    "COP",
    "CRC",
    "HUF",
    "ISK",
    "IDR",
    "JPY",
    "KRW",
    "PYG",
    "TWD",
    "VND",
  ];
  let currencies = 100;
  if (arr.includes(currency)) {
    currencies = 1;
  }
  return Math.round((num / currencies + Number.EPSILON) * 10) / 10;
}

function getStatusAcc(num) {
  let astatus = "";
  switch (num) {
    case 1:
      astatus = "Hoạt động";
      break; ///active
    case 2:
      astatus = "Vô hiệu";
      break; //disabled
    case 3:
      astatus = "Dư Nợ";
      break;
    case 7:
      astatus = "Pending Review"; //PENDING_RISK_REVIEW
      break;
    case 8:
      astatus = "Pending Settlement";
      break;
    case 9:
      astatus = "Ân hạn"; //IN_GRACE_PERIOD In
      break;
    case 100:
      astatus = "Pending Closure";
      break;
    case 101:
      astatus = "Đóng";
      break;
    case 201:
      astatus = "Any Active";
      break;
    case 202:
      astatus = "Any Close";
      break;
    default:
      astatus = "Unknow";
      break;
  }
  return astatus;
}

window.alertGreen = function (message, timeout = null) {
  const alert = document.createElement("div");
  const alertButton = document.createElement("button");
  alertButton.innerHTML = "OK";
  alert.classList.add("alert_green");
  alert.innerHTML = `<span >${message}</span>`;
  alertButton.addEventListener("click", (e) => {
    alert.remove();
  });
  if (timeout != null) {
    setTimeout(() => {
      alert.remove();
    }, Number(timeout));
    document.body.appendChild(alert);
  }
};

window.alert = function (message, timeout = null) {
  const alert = document.createElement("div");
  const alertButton = document.createElement("button");
  alertButton.innerHTML = "OK";
  alert.classList.add("alert");
  alert.innerHTML = `<span>${message}</span>`;
  alert.appendChild(alertButton);
  alertButton.addEventListener("click", (e) => {
    alert.remove();
  });
  if (timeout != null) {
    setTimeout(() => {
      alert.remove();
    }, Number(timeout));
  }
  document.body.appendChild(alert);
};
