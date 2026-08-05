import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { connectDB } from '../lib/db';
import { Scholarship } from '../models/Scholarship';
import { getConfig } from '../config';

async function seed() {
  try {
    const config = getConfig();
    await connectDB(config.mongodbUri);

    const dataDir = path.join(process.cwd(), 'src', 'data');
    const files = fs.readdirSync(dataDir).filter(file => file.endsWith('.ts'));

    // The Safety Net
    await Scholarship.deleteMany({});
    console.log('Cleared existing scholarship data.');

    let totalInserted = 0;

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
        totalInserted += reducedData.length;
      }
    }

    console.log(`Successfully seeded ${totalInserted} scholarships.`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seed();