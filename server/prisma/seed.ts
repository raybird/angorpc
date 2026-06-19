import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('開始進行資料庫播種 (Seeding)...');

  // Clean old data (mind foreign key dependencies)
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.cartItem.deleteMany({});
  await prisma.productVariant.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});

  // 1. Create categories
  const cat3c = await prisma.category.create({
    data: {
      name: '3C 電子',
      slug: '3c-electronics',
      description: '最新款極速筆電、智慧手機與音訊周邊商品',
    },
  });

  const catAppliance = await prisma.category.create({
    data: {
      name: '智慧家電',
      slug: 'smart-appliances',
      description: '科技化居家生活體驗，精緻美觀的智慧小家電',
    },
  });

  const catGeneral = await prisma.category.create({
    data: {
      name: '生活百貨',
      slug: 'general-store',
      description: 'AngoRPC 品牌特製周邊、極簡服飾與文創小物',
    },
  });

  console.log('分類建立完成。');

  // 2. Create products with variants
  await prisma.product.create({
    data: {
      name: 'AngoRPC Horizon Book 15',
      slug: 'angorpc-horizon-book-15',
      description: '搭載最新 AI 晶片，專為高強度程式開發設計，極窄邊框 15 吋 OLED 螢幕，極致效能與卓越續航力。',
      price: 35000,
      categoryId: cat3c.id,
      stock: 50,
      isActive: true,
      variants: {
        create: [
          { name: '16GB RAM + 512GB SSD', sku: 'HB15-16-512', price: 35000, stock: 20, attributes: { spec: '16GB/512GB' } },
          { name: '32GB RAM + 1TB SSD', sku: 'HB15-32-1T', price: 42000, stock: 30, attributes: { spec: '32GB/1TB' } }
        ]
      }
    }
  });

  await prisma.product.create({
    data: {
      name: 'Quantum Buds Pro',
      slug: 'quantum-buds-pro',
      description: '真無線藍牙降噪耳機，48dB 智慧動態降噪，空間音訊演算，給您身歷其境的無失真震撼音質。',
      price: 3200,
      categoryId: cat3c.id,
      stock: 120,
      isActive: true,
      variants: {
        create: [
          { name: '霧黑 (Matte Black)', sku: 'QBPRO-BLK', price: 3200, stock: 60, attributes: { color: '霧黑' } },
          { name: '極光白 (Aurora White)', sku: 'QBPRO-WHT', price: 3200, stock: 60, attributes: { color: '極光白' } }
        ]
      }
    }
  });

  await prisma.product.create({
    data: {
      name: 'Aura Glow 智慧極光氛圍燈',
      slug: 'aura-glow-ambient-light',
      description: '支援 1600 萬色動態流光，無級亮度調節，能與電腦音效即時同步律動，打造極致沉浸式的桌面美學。',
      price: 1800,
      categoryId: catAppliance.id,
      stock: 80,
      isActive: true,
      variants: {
        create: [
          { name: 'USB 供電款', sku: 'AGLIGHT-USB', price: 1800, stock: 40, attributes: { type: 'USB' } },
          { name: '110V 插頭供電款', sku: 'AGLIGHT-110V', price: 1950, stock: 40, attributes: { type: '110V' } }
        ]
      }
    }
  });

  await prisma.product.create({
    data: {
      name: 'AngoRPC 極簡修身黑 T-Shirt',
      slug: 'angorpc-minimalist-tee',
      description: '100% 精梳重磅純棉，修身防皺剪裁，胸口帶有 AngoRPC 標誌性刺繡，簡約好看、百搭首選。',
      price: 590,
      categoryId: catGeneral.id,
      stock: 200,
      isActive: true,
      variants: {
        create: [
          { name: 'M 號 (Medium)', sku: 'TEE-BLK-M', price: 590, stock: 50, attributes: { size: 'M' } },
          { name: 'L 號 (Large)', sku: 'TEE-BLK-L', price: 590, stock: 80, attributes: { size: 'L' } },
          { name: 'XL 號 (Extra Large)', sku: 'TEE-BLK-XL', price: 590, stock: 70, attributes: { size: 'XL' } }
        ]
      }
    }
  });

  console.log('商品及變體規格播種建立完成。');
  console.log('資料庫播種成功！');
}

main()
  .catch((e) => {
    console.error('播種過程發生錯誤:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
