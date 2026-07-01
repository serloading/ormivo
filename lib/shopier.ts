import { createHmac, randomBytes } from "crypto";

export const SHOPIER_API_URL = "https://www.shopier.com/ShowProduct/api_pay4.php";

export interface ShopierParams {
  API_key:           string;
  website_index:     string;
  platform_order_id: string;
  product_name:      string;
  product_type:      string; // 0=fiziksel, 1=dijital, 2=hizmet
  buyer_name:        string;
  buyer_email:       string;
  buyer_phone:       string;
  buyer_address:     string;
  buyer_city:        string;
  buyer_country:     string;
  buyer_postcode:    string;
  total_order_value: string;
  currency:          string; // 0=TRY, 1=USD, 2=EUR
  installment_count: string;
  current_language:  string; // 0=TR, 1=EN
  callback_url:      string;
  random_nr:         string;
  signature:         string;
}

export function buildShopierParams(opts: {
  orderNo:      string;
  total:        number;
  buyerName:    string;
  buyerEmail:   string;
  buyerPhone:   string;
  buyerAddress: string;
  buyerCity:    string;
  callbackUrl:  string;
}): ShopierParams {
  const apiKey    = process.env.SHOPIER_API_KEY!;
  const apiSecret = process.env.SHOPIER_API_SECRET!;
  const randomNr  = randomBytes(16).toString("hex");
  const currency  = "0"; // TRY
  const amount    = opts.total.toFixed(2);

  const signature = createHmac("sha256", apiSecret)
    .update(randomNr + opts.orderNo + amount + currency)
    .digest("base64");

  return {
    API_key:           apiKey,
    website_index:     "1",
    platform_order_id: opts.orderNo,
    product_name:      "Ormivo Parfüm Siparişi",
    product_type:      "0",
    buyer_name:        opts.buyerName,
    buyer_email:       opts.buyerEmail || "musteri@ormivo.com",
    buyer_phone:       opts.buyerPhone.replace(/\D/g, ""),
    buyer_address:     opts.buyerAddress,
    buyer_city:        opts.buyerCity,
    buyer_country:     "TR",
    buyer_postcode:    "00000",
    total_order_value: amount,
    currency,
    installment_count: "0",
    current_language:  "0",
    callback_url:      opts.callbackUrl,
    random_nr:         randomNr,
    signature,
  };
}

export function verifyShopierCallback(params: {
  random_nr:         string;
  platform_order_id: string;
  status:            string;
  signature:         string;
}): boolean {
  const apiSecret = process.env.SHOPIER_API_SECRET!;
  const expected = createHmac("sha256", apiSecret)
    .update(params.random_nr + params.platform_order_id + params.status)
    .digest("base64");
  return expected === params.signature;
}
