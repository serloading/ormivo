# Ormivo CRM Sistemi — Dokümantasyon

## İçindekiler
1. [Genel Yapı](#genel-yapı)
2. [Ürün Yönetimi](#ürün-yönetimi)
3. [Sipariş Yönetimi](#sipariş-yönetimi)
4. [Finans Yönetimi](#finans-yönetimi)
5. [Borç / Alacak](#borç--alacak)
6. [Rapor](#rapor)
7. [CRM — Müşteri Profilleri](#crm--müşteri-profilleri)
8. [SMS Bildirim Altyapısı](#sms-bildirim-altyapısı)
9. [Sistem Logları (Activity Log)](#sistem-logları-activity-log)
10. [Site — Müşteri Tarafı](#site--müşteri-tarafı)
11. [Veri Modeli Özeti](#veri-modeli-özeti)
12. [Otomatik Finans Akışı](#otomatik-finans-akışı)

---

## Genel Yapı

Admin paneli `/admin` altında çalışır. Erişim için NextAuth oturumu gerekir (email + şifre, `AdminUser` tablosu).

### Sol Menü (Sidebar)

| Grup | Sayfa | Adres |
|---|---|---|
| — | Dashboard | `/admin/dashboard` |
| Ürün Yönetimi | Ürünler | `/admin/urunler` |
| | Kategoriler | `/admin/kategoriler` |
| | Markalar | `/admin/markalar` |
| Sipariş Yönetimi | Siparişler (tümü aktif) | `/admin/siparisler` |
| | Bekleyenler | `/admin/siparisler?status=PENDING` |
| | Kargoya Verildi | `/admin/siparisler?status=SHIPPED` |
| | Teslim Edilenler | `/admin/siparisler?status=DELIVERED` |
| | İptal Edilenler | `/admin/siparisler?status=CANCELLED` |
| Finans Yönetimi | Gelir & Gider | `/admin/finans` |
| | Borç / Alacak | `/admin/borc-alacak` |
| | Rapor | `/admin/rapor` |
| CRM | Müşteriler | `/admin/musteriler` |

---

## Ürün Yönetimi

### Ürünler (`/admin/urunler`)

Her ürünün alanları:
- **name** — ürün adı
- **slug** — URL dostu tekil ad
- **price** — satış fiyatı (₺)
- **comparePrice** — üstü çizili eski fiyat (opsiyonel)
- **costPrice** — alış/maliyet fiyatı (₺) — finans hesaplamalarında kullanılır
- **stock** — stok adedi
- **isActive** — aktif/pasif
- **isOzelKoleksiyon** — özel koleksiyon üyesi mi
- **category**, **brand** — kategori ve marka ilişkisi
- **images** — ürün görselleri (array)

### Önemli Davranışlar

**`costPrice` güncellendiğinde:** Sistemdeki tüm PAID veya FREE statüsündeki web siparişleri taranır, o ürünü içerenlerin Finance gider kayıtları otomatik güncellenir (`rebuildCostExpensesForProduct`).

**Stok:** Manuel sipariş oluşturulurken seçilen ürünlerin stoğu otomatik düşer. Sipariş iptal edildiğinde stok geri iade edilir (bkz. [İptal Senaryosu](#sipariş-iptali-cancelled)).

---

## Sipariş Yönetimi

Sistemde **iki tür** sipariş vardır:

| Tür | Model | Kaynak | Müşteri |
|---|---|---|---|
| **Web siparişi** | `SiteOrder` | Siteden verilen | `SiteUser` (üye) + opsiyonel `Customer` |
| **Manuel sipariş** | `Order` | Admin tarafından girilen | `Customer` (B2B) |

### Sipariş Durumları

```
PENDING → SHIPPED → DELIVERED
       ↘
        CANCELLED
```

- **PENDING** — Beklemede
- **SHIPPED** — Kargoya Verildi
- **DELIVERED** — Teslim Edildi
- **CANCELLED** — İptal Edildi

### Sipariş Listesi (`/admin/siparisler`)

**Filtreler:**
- Filtre yok → DELIVERED ve CANCELLED hariç tüm aktif siparişler
- `?status=PENDING` → yalnızca bekleyenler
- `?status=SHIPPED` → kargoya verilenler
- `?status=DELIVERED` → teslim edilenler
- `?status=CANCELLED` → iptal edilenler

**Tablo sütunları:** Sipariş No, Müşteri, Ürünler, Tutar, Durum, Ödeme, Teslimat, Kargo

### Satır İçi Düzenlemeler

Her siparişte tablonun içinden doğrudan değiştirilebilen alanlar:

| Alan | Web | Manuel | Not |
|---|---|---|---|
| Durum | ✓ | ✓ | 4 seçenek; CANCELLED özel tetikleyiciler çalıştırır |
| Ödeme | ✓ (PENDING/PAID/FREE) | ✓ (PENDING/PAID) | Finance kaydı tetikler |
| Teslimat | ✓ (CARGO/PICKUP) | ✓ | CARGO → kargo gideri + SMS tetikleyicisi |
| İskonto | ✓ | — | Finance gelirini günceller |
| Tutar | — | ✓ | Elle girilebilir |
| Kargo Bilgisi | ✓ | — | Takip no + firma; SMS gönderiminde kullanılır |

### Manuel Sipariş Oluşturma (+ Sipariş Ekle Butonu)

Modal açılır ve şunlar doldurulur:
1. **Müşteri seçimi** — mevcut müşterilerden seç veya "Yeni müşteri ekle" ile anlık kayıt (ad, telefon)
2. **Sipariş durumu** — Beklemede / Kargoya Verildi / Teslim Edildi / İptal Edildi
3. **Teslimat yöntemi** — Kargo / Ofisten Teslim
4. **Ürünler** — ürün adı yazıldıkça aktif ürünlerden autocomplete; fiyat otomatik gelir; adet girilir; stok düşer
   - Listede yoksa: "Yeni ürün ekle" → ad, satış fiyatı, alış fiyatı, kategori, marka
5. **Tutar** — otomatik (ürünlerin toplamı) veya manuel giriş
6. **Not**

### Sipariş İptali (CANCELLED)

Bir sipariş CANCELLED durumuna çekildiğinde sistem **otomatik olarak** aşağıdaki üç adımı gerçekleştirir:

#### 1. Finans Terslemesi
- Siparişe ait **INCOME** (gelir) kaydı varsa silinir veya `0₺` ile sıfırlanır.
- Siparişe ait tüm **Ürün Maliyeti** EXPENSE kayıtları silinir.
- Siparişe ait **Kargo Gideri** EXPENSE kaydı varsa silinir.

#### 2. Stok İadesi
- Siparişin `items` listesindeki her ürün (productId'si biliniyorsa) için `stock` değeri `quantity` kadar artırılır.
- Sadece mevcut, silinmemiş ürünlere iade yapılır; silinmiş veya pasif ürünler atlanır.

#### 3. Activity Log
- `ActivityLog` tablosuna `entity: ORDER`, `action: CANCELLED`, `detail: { orderId, orderNo, refundedItems, reversedFinance }` şeklinde kayıt düşülür (bkz. [Sistem Logları](#sistem-logları-activity-log)).

> **Kural:** İptal, ödeme durumundan bağımsızdır. PAID bir sipariş iptal edilse bile gelir kaydı silinir. İptal sonrası sipariş tekrar PENDING'e alınamaz; yeni sipariş açılması gerekir.

---

## Finans Yönetimi

### Gelir & Gider (`/admin/finans`)

`Finance` tablosundaki tüm kayıtlar listelenir. Her kayıt:
- **type**: `INCOME` veya `EXPENSE`
- **amount**: tutar (₺)
- **description**: açıklama
- **category**: Satış / Kargo Gideri / Ürün Maliyeti / Diğer
- **date**: tarih
- **siteOrderId**: web siparişine bağlı ise (opsiyonel)
- **orderId**: manuel siparişe bağlı ise (opsiyonel) *(yeni alan)*

Manuel kayıt da eklenebilir. Manuel kayıt girildiğinde `ActivityLog`'a düşer.

### Otomatik Oluşturulan Finance Kayıtları

#### Web Siparişi — Ödeme "PAID" yapıldığında
1. **INCOME** kaydı oluşur:
   - Tutar: `sipariş toplamı - iskonto`
   - Açıklama: `Sipariş #[orderNo]` (iskonto varsa `(X₺ iskonto)` notu eklenir)
   - Kategori: Satış
2. Her ürün için ayrı **EXPENSE** kaydı oluşur:
   - Tutar: `ürün alış fiyatı (costPrice) × adet`
   - Açıklama: `Ürün maliyeti — [ürün adı] — #[orderNo]`
   - Kategori: Ürün Maliyeti

#### Web Siparişi — Ödeme "FREE" (bedava) yapıldığında
- Gelir kaydı oluşmaz.
- Ürün maliyet EXPENSE kayıtları yine oluşur.

#### Web Siparişi — Teslimat "CARGO" yapıldığında
- **EXPENSE** kaydı: 200₺, Kategori: Kargo Gideri
- Teslimat "PICKUP"a çevrilirse bu kayıt silinir.

#### Web Siparişi — İskonto güncellendiğinde
- Sipariş PAID ise mevcut INCOME kaydının tutarı güncellenir: `yeni tutar = toplam - yeni iskonto`

#### Web Siparişi — CANCELLED yapıldığında
- Mevcut INCOME kaydı silinir.
- Tüm Ürün Maliyeti ve Kargo Gideri EXPENSE kayıtları silinir.

#### Manuel Sipariş — Ödeme "PAID" yapıldığında
1. **INCOME** kaydı oluşur:
   - Tutar: sipariş toplamı
   - Açıklama: `Sipariş #[orderNo] (Manuel)`
   - Kategori: Satış
2. Siparişteki her ürün için ayrı **EXPENSE** kaydı oluşur *(yeni davranış)*:
   - Tutar: `ürün alış fiyatı (costPrice) × adet`
   - Açıklama: `Ürün maliyeti — [ürün adı] — #[orderNo]`
   - Kategori: Ürün Maliyeti
   - `costPrice` girilmemiş ürünler atlanır.

#### Manuel Sipariş — CANCELLED yapıldığında
- Mevcut INCOME kaydı silinir.
- Tüm Ürün Maliyeti EXPENSE kayıtları silinir.
- Stok iade edilir.

---

## Borç / Alacak

`/admin/borc-alacak` — iki sekme:

### Müşteri Alacakları
- Ödeme durumu PENDING olan site siparişleri (web) mor bölümde listelenir.
- Ayrıca manuel olarak girilen müşteri borçları (`CustomerDebt`) listelenir.
- Kısmi ödeme yapılabilir, ödeme geçmişi tutulur.

### Tedarikçi Borçları
- `SupplierDebt` tablosundan beslenir.
- Tedarikçiye olan borçlar ve kısmi ödemeler takip edilir.

---

## Rapor

`/admin/rapor` — aylık bazda finansal özet ve satış analizi.

### Filtreler
- **Ay seçimi** — verideki mevcut aylara göre dropdown
- **Kategori** — ürün kategorisine göre filtre
- **Marka** — markaya göre filtre

### Gösterilen Bilgiler

#### Finansal Özet (seçili aya göre)
| Kart | Kaynak |
|---|---|
| Toplam Satış Geliri | Finance INCOME kayıtları (web + manuel) |
| Kargo Giderleri | Finance EXPENSE / Kargo Gideri kategorisi |
| Ürün Maliyetleri | Finance EXPENSE / Ürün Maliyeti kategorisi (web + manuel) |
| Net Kâr | Satış Geliri − Kargo − Ürün Maliyeti |

#### En Çok Satan Ürünler
- Varsayılan: ilk 10 ürün (satış adedine göre)
- "Tümünü Göster" ile tam liste açılır
- Sütunlar: Sıra, Ürün, Kategori, Marka, Satış Adedi, Ciro (₺)

---

## CRM — Müşteri Profilleri

### Müşteri Modeli (Genişletilmiş)

Mevcut `Customer` tablosuna aşağıdaki alanlar eklenir:

```prisma
model Customer {
  // ...mevcut alanlar...
  segment   String?   // "VIP" | "AT_RISK" | "LOST" | "NEW" | "REGULAR"
  tags      String[]  // ["B2B", "Sorunlu", "Toptan", vb.] — serbest etiket dizisi
  notes     CustomerNote[]
}

model CustomerNote {
  id         String   @id @default(cuid())
  customerId String
  customer   Customer @relation(fields: [customerId], references: [id])
  content    String
  createdAt  DateTime @default(now())
  createdBy  String   // AdminUser.email
}
```

`SiteUser` için etiket ve segment bilgisi dolaylı olarak bağlı `Customer` kaydı üzerinden takip edilir (bir `SiteUser` bir `Customer`'a bağlanabilir).

### Müşteri Segmentasyonu (RFM Temelli)

Segmentler sistematik olarak ya admin tarafından manuel set edilir ya da periyodik bir hesaplama ile otomatik güncellenir. Hesaplama üç metriğe dayanır:

| Metrik | Tanım |
|---|---|
| **R (Recency)** | Son sipariş ne kadar zaman önce verildi? |
| **F (Frequency)** | Toplam sipariş sayısı |
| **M (Monetary)** | Toplam harcama tutarı (₺) |

#### Segment Tanımları

| Segment | Kural (Öneri) | Etiket Rengi |
|---|---|---|
| **VIP** | Son 90 gün içinde sipariş, ≥5 sipariş veya ≥5.000₺ toplam harcama | Altın |
| **Regular** | Son 180 gün içinde sipariş, 2-4 sipariş arası | Gri |
| **New** | Tek siparişi var, ≤30 gün | Mavi |
| **At Risk** | Son siparişi 90-180 gün önce, önceden aktifti | Turuncu |
| **Lost** | Son siparişi 180+ gün önce | Kırmızı |

> Segment eşik değerleri iş ihtiyacına göre ayarlanabilir. Otomatik hesaplama için bir cron job veya admin panelinden tetiklenen bir "Segmentleri Güncelle" butonu önerilir.

### Müşteri Profil Sayfası (`/admin/musteriler/[id]`)

Her müşteri için görünür bilgiler:
- Kişisel bilgiler (ad, telefon, e-posta, şehir)
- Segment rozeti ve etiketler (eklenebilir/silinebilir)
- Sipariş geçmişi (web + manuel, tarih sıralı)
- Toplam harcama, sipariş sayısı, son sipariş tarihi
- **Notlar bölümü:** admin notları zaman damgası ve yazarıyla listelenir; yeni not eklenebilir

---

## SMS Bildirim Altyapısı

### Kapsam ve Kural

SMS bildirimi **yalnızca bir koşulda** tetiklenir:

> Bir web siparişinin (`SiteOrder`) durumu **SHIPPED** yapıldığında ve sipariş için **kargo takip numarası** girilmişse.

Başka hiçbir durum geçişi (sipariş alındı, ödeme yapıldı, teslim edildi vb.) SMS göndermez.

### Tetiklenme Akışı

```
Admin → "Kargoya Verildi" seçer + Takip No girer
         │
         ▼
updateSiteOrderStatus(orderId, "SHIPPED")
         │
         ├─► SiteOrder.status = SHIPPED
         │
         └─► smsQueue.push({
               to: order.recipientPhone,
               message: `Siparişiniz kargoya verildi. Takip kodu: ${trackingNo} / ${cargoCompany}`
             })
                  │
                  ▼
            SMS Provider API (Netgsm / Twilio / vb.)
```

### Modüler Tasarım

SMS gönderimi bağımsız bir servis katmanında (`lib/sms.ts`) tutulur. Sağlayıcı değişse bile sipariş akışı kodu değişmez.

```typescript
// lib/sms.ts — arayüz sabit kalır, implementasyon değişebilir
export async function sendShippedSms(params: {
  phone: string;
  trackingNo: string;
  cargoCompany: string;
  orderNo: string;
}): Promise<{ success: boolean; error?: string }>;
```

### Entegrasyon Notları
- SMS sağlayıcısı API anahtarı `.env` içinde `SMS_API_KEY` olarak tutulur.
- `SMS_ENABLED=true/false` flag'i ile SMS gönderimi ortama göre açılıp kapatılabilir.
- SMS gönderimi başarısız olursa sipariş durumu geri alınmaz; hata `ActivityLog`'a düşer.
- Müşterinin telefon numarası boşsa SMS atlanır, log kaydı düşer.

---

## Sistem Logları (Activity Log)

### Amaç

Hangi adminın hangi kritik veriyi ne zaman değiştirdiğini iz bırakacak şekilde kayıt altına alır. Hata ayıklama, itiraz yönetimi ve güvenlik denetimi için kullanılır.

### Veri Modeli

```prisma
model ActivityLog {
  id         String   @id @default(cuid())
  adminEmail String                        // kimin yaptığı
  action     String                        // "ORDER_CANCELLED", "PRICE_CHANGED", vb.
  entity     String                        // "ORDER" | "PRODUCT" | "FINANCE" | "CUSTOMER"
  entityId   String                        // ilgili kaydın id'si
  detail     Json?                         // eski/yeni değer, etkilenen alanlar
  createdAt  DateTime @default(now())
}
```

### Loglanan Kritik Olaylar

| action | entity | Ne zaman |
|---|---|---|
| `ORDER_STATUS_CHANGED` | ORDER | Sipariş durumu değiştiğinde |
| `ORDER_CANCELLED` | ORDER | Sipariş iptal edildiğinde (ters işlem detayları dahil) |
| `ORDER_PAYMENT_CHANGED` | ORDER | Ödeme durumu değiştiğinde |
| `PRODUCT_PRICE_CHANGED` | PRODUCT | Satış fiyatı veya alış fiyatı güncellendiğinde |
| `FINANCE_MANUAL_ENTRY` | FINANCE | Admin manuel gelir/gider kaydı oluşturduğunda |
| `FINANCE_DELETED` | FINANCE | Bir Finance kaydı silindiğinde |
| `CUSTOMER_SEGMENT_CHANGED` | CUSTOMER | Segment veya etiket güncellendiğinde |
| `SMS_SEND_FAILED` | ORDER | SMS gönderimi başarısız olduğunda |

### `detail` Alanı Örnekleri

```json
// ORDER_CANCELLED
{
  "orderNo": "ORV-1719183600000",
  "previousStatus": "PAID",
  "refundedItems": [{ "name": "Oud Intense", "qty": 2, "stockRestored": 2 }],
  "reversedFinance": { "incomeDeleted": 1, "expenseDeleted": 3 }
}

// PRODUCT_PRICE_CHANGED
{
  "field": "price",
  "oldValue": 2500,
  "newValue": 3000
}

// FINANCE_MANUAL_ENTRY
{
  "type": "EXPENSE",
  "amount": 450,
  "category": "Kargo Gideri",
  "description": "Yurtiçi Kargo faturası Haziran"
}
```

### Log Görüntüleme

`/admin/loglar` sayfasında (ileride eklenecek) tüm log kayıtları tarih sırasıyla listelenir. Filtreleme: entity türü, action, admin, tarih aralığı.

---

## Site — Müşteri Tarafı

### Sayfalar
| Adres | İçerik |
|---|---|
| `/` | Ana sayfa — öne çıkan ürünler |
| `/urunler` | Ürün listesi |
| `/urunler/[slug]` | Ürün detayı |
| `/sepet` | Sepet |
| `/kayit` | Üye kaydı (ad, telefon, şifre) |
| `/giris` | Giriş (telefon + şifre) |
| `/hesabim` | Hesap bilgileri ve geçmiş siparişler |
| `/hesabim/adres-ekle` | Yeni adres ekleme |
| `/siparis-tamamlandi` | Sipariş onay sayfası |
| `/hakkimizda` | Hakkımızda |
| `/iletisim` | İletişim |

### Oturum Sistemi
- Özel JWT oturumu: `jose` kütüphanesi, `site_session` cookie
- Giriş yapılmamışken "Sepete Ekle" → `/giris` yönlendirmesi

### Sipariş Akışı (Web)
1. Kullanıcı ürün sepete ekler (`CartItem`)
2. Sepet sayfasından sipariş verir → `SiteOrder` oluşur, `status: PENDING`, `paymentStatus: PENDING`
3. Admin panelinde sipariş görünür → durum ve ödeme güncellenebilir
4. Ödeme PAID yapılınca Finance kayıtları otomatik oluşur
5. Durum SHIPPED + takip numarası girilince SMS tetiklenir

---

## Veri Modeli Özeti

```
Brand         ─┐
Category      ─┤──► Product ──► CartItem ──► Cart ──► SiteUser
                                                          │
                                                     SiteOrder ──► Finance (INCOME + EXPENSE)
                                                          │
Customer ──► Order ──► Finance (INCOME + EXPENSE)    Address
    │
    ├──► CustomerNote  (admin notları)
    ├──► CustomerDebt ──► DebtPayment
    └──► [segment, tags]

SupplierDebt ──► SupplierPayment
AdminUser (admin oturumu)
Finance (tüm gelir/gider kayıtları)
ActivityLog (tüm kritik işlem logları)
```

### Sipariş Modelleri Farkı

| Alan | SiteOrder (Web) | Order (Manuel) |
|---|---|---|
| Müşteri | `SiteUser` + `Customer` | yalnızca `Customer` |
| paymentStatus | PENDING / PAID / FREE | PENDING / PAID |
| deliveryMethod | CARGO / PICKUP (default: CARGO) | CARGO / PICKUP (default: PICKUP) |
| discount | ✓ (iskonto alanı) | — |
| trackingNo / cargoCompany | ✓ (SMS tetikleyicisi) | — |
| Ürün maliyeti otomasyonu | ✓ | ✓ *(güncellendi)* |
| İptal → stok iadesi | ✓ | ✓ |
| İptal → finans terslemesi | ✓ | ✓ |

### Finance Tablosuna Eklenen Alanlar

| Alan | Tip | Açıklama |
|---|---|---|
| `siteOrderId` | String? | Web siparişine bağlı Finance kaydı |
| `orderId` | String? | Manuel siparişe bağlı Finance kaydı *(yeni)* |

---

## Otomatik Finans Akışı

```
Web Siparişi Ödeme = PAID
        │
        ├─► Finance INCOME  (toplam - iskonto)  ── "Sipariş #ORV-..."
        └─► Her ürün → Finance EXPENSE ─────────── "Ürün maliyeti — [ürün] — #ORV-..."

Manuel Sipariş Ödeme = PAID                         ← YENİ
        │
        ├─► Finance INCOME  (toplam)  ───────────── "Sipariş #ORV-... (Manuel)"
        └─► Her ürün (costPrice varsa) → Finance EXPENSE ── "Ürün maliyeti — [ürün] — #ORV-..."

Teslimat = CARGO (Web)
        │
        └─► Finance EXPENSE (200₺) ──────────────── "Kargo — Sipariş #..."

Durum = SHIPPED + Takip No (Web)
        │
        └─► SMS → müşteri telefonu ──────────────── "Siparişiniz kargoya verildi. Takip: [no]"

Sipariş = CANCELLED (Web veya Manuel)               ← YENİ
        │
        ├─► Finance INCOME silinir
        ├─► Finance EXPENSE (Ürün Maliyeti + Kargo) silinir
        ├─► Stok geri iade edilir (her ürün için +qty)
        └─► ActivityLog kaydı düşer

Ürün costPrice güncellendi
        │
        └─► Tüm PAID/FREE web siparişlerindeki maliyet kayıtları güncellenir
```

---

*Son güncelleme: Haziran 2026*
