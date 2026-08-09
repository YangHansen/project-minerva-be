const orig = process.getBuiltinModule;
if (orig) {
  process.getBuiltinModule = (name: string) => {
    if (name === 'v8') return { startupSnapshot: { isBuildingSnapshot: () => false } };
    try { return orig(name); } catch (e) { return undefined; }
  };
}

async function main() {
  const fs = (await import('fs')).default;
  const path = (await import('path')).default;
  const { pathToFileURL } = await import('url');
  
  const { connectDB } = await import('../lib/db');
  const { Scholarship } = await import('../models/Scholarship');
  const { IELTSExercise } = await import('../models/IELTS');
  const { getConfig } = await import('../config');
  const { ieltsSeedData } = await import('../data/ielts-seed');
  const { SubscriptionPlan } = await import('../models/Billing');
  const { billingSeedData } = await import('../data/billing_seed');

  try {
    const config = getConfig();
    await connectDB(config.mongodbUri);

    console.log('--- Seeding IELTS Exercises ---');
    await IELTSExercise.deleteMany({});
    console.log('Cleared existing IELTS data.');
    await IELTSExercise.insertMany(ieltsSeedData);
    console.log(`Inserted ${ieltsSeedData.length} IELTS exercises.`);

    console.log('\n--- Seeding Subscription Plans ---');
    await SubscriptionPlan.deleteMany({});
    console.log('Cleared existing SubscriptionPlan data.');
    await SubscriptionPlan.insertMany(billingSeedData);
    console.log(`Inserted ${billingSeedData.length} subscription plans.`);

    console.log('\n--- Seeding Scholarships ---');
    await Scholarship.deleteMany({});
    console.log('Cleared existing Scholarship data.');

    const dataDir = path.join(process.cwd(), 'src', 'data');
    const files = fs.readdirSync(dataDir).filter((file: string) => file.endsWith('.ts') && file !== 'ielts-seed.ts');

    let totalScholarships = 0;
    for (const file of files) {
      const filePath = path.join(dataDir, file);
      const fileUrl = pathToFileURL(filePath).href;
      const module = await import(fileUrl);
      
      const exportNames = Object.keys(module);
      if (exportNames.length === 0) continue;
      
      const rawData = module[exportNames[0]];
      
      if (Array.isArray(rawData) && rawData.length > 0) {
        // Only grab the first 50 items from every file
        const reducedData = rawData.slice(0, 50); 
        await Scholarship.insertMany(reducedData);
        console.log(`Inserted ${reducedData.length} scholarships from ${file} (Reduced from ${rawData.length})`);
        totalScholarships += reducedData.length;
      }
    }
    console.log(`Successfully seeded ${totalScholarships} scholarships.`);

    console.log('\nAll Seeding Complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

main();
