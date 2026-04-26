const crypto = require('crypto');
const qs = require('querystring');

function sortVnpayObject(obj) {
  let sorted = {};
  let keys = Object.keys(obj).sort();
  for (let key of keys) {
    if (obj[key] !== '' && obj[key] !== null && obj[key] !== undefined) {
      sorted[key] = encodeURIComponent(obj[key]).replace(/%20/g, "+");
    }
  }
  return sorted;
}

function getVnpayQueryString(sortedParams) {
  return Object.keys(sortedParams).map(key => `${key}=${sortedParams[key]}`).join('&');
}

function createVnpaySignature(sortedParams, hashSecret) {
  const signData = getVnpayQueryString(sortedParams);
  return crypto.createHmac('sha512', hashSecret).update(signData).digest('hex');
}

const originalParams = {
  vnp_Amount: "26200000",
  vnp_Command: "pay",
  vnp_CreateDate: "20260426195332",
  vnp_CurrCode: "VND",
  vnp_ExpireDate: "20260426200832",
  vnp_IpAddr: "127.0.0.1",
  vnp_Locale: "vn",
  vnp_OrderInfo: "Dat ve phim Avengers: Endgame (Updated)",
  vnp_OrderType: "billpayment",
  vnp_ReturnUrl: "http://localhost:3000/api/v1/payments/vnpay/return",
  vnp_TmnCode: "O1US5A1O",
  vnp_TxnRef: "CS-8CAE4836",
  vnp_Version: "2.1.0"
};

const SECRET = "YOUR_SECRET_HERE"; // Just simulating
// 1. URL Creation Sign
const createdSorted = sortVnpayObject(originalParams);
const originalSig = createVnpaySignature(createdSorted, SECRET);
console.log("Original Sig:", originalSig);

// 2. Simulated Return Sign (Express decodes it)
// Express decoded params from VNPay (mimicking req.query)
const expressedParams = {
  ...originalParams,
  vnp_ResponseCode: "00",
  vnp_TransactionNo: "12345678",
  vnp_BankCode: "NCB",
  vnp_PayDate: "20260426200000"
};

const returnSorted = sortVnpayObject(expressedParams);
const returnSig = createVnpaySignature(returnSorted, SECRET);
console.log("Return Sig:", returnSig);
