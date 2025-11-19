import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Seed standardized stances
  const stances = [
    {
      category: 'Healthcare',
      title: 'Universal Healthcare',
      description: 'Access to healthcare as a fundamental right, including proposals for universal coverage, Medicare for All, or public option systems.',
      order: 1,
    },
    {
      category: 'Healthcare',
      title: 'Prescription Drug Pricing',
      description: 'Policies to reduce prescription drug costs, including allowing Medicare to negotiate prices or importing medications from other countries.',
      order: 2,
    },
    {
      category: 'Education',
      title: 'Public Education Funding',
      description: 'Federal and state funding for K-12 public schools, teacher salaries, and educational resources.',
      order: 3,
    },
    {
      category: 'Education',
      title: 'Higher Education & Student Debt',
      description: 'College affordability, student loan forgiveness, free community college, and higher education funding.',
      order: 4,
    },
    {
      category: 'Environment',
      title: 'Climate Change Action',
      description: 'Policies to address climate change, including carbon emissions reduction, renewable energy investment, and rejoining international climate agreements.',
      order: 5,
    },
    {
      category: 'Environment',
      title: 'Environmental Protection',
      description: 'Conservation efforts, protection of public lands, clean water and air regulations, and environmental justice.',
      order: 6,
    },
    {
      category: 'Economy',
      title: 'Tax Policy',
      description: 'Tax rates for individuals and corporations, tax credits, and overall tax reform.',
      order: 7,
    },
    {
      category: 'Economy',
      title: 'Minimum Wage',
      description: 'Federal and state minimum wage levels and indexing to inflation.',
      order: 8,
    },
    {
      category: 'Economy',
      title: 'Workers Rights & Unions',
      description: 'Labor union protections, collective bargaining rights, and workplace regulations.',
      order: 9,
    },
    {
      category: 'Criminal Justice',
      title: 'Police Reform',
      description: 'Law enforcement accountability, training requirements, use of force policies, and qualified immunity.',
      order: 10,
    },
    {
      category: 'Criminal Justice',
      title: 'Sentencing & Prison Reform',
      description: 'Criminal sentencing guidelines, mandatory minimums, prison conditions, and rehabilitation programs.',
      order: 11,
    },
    {
      category: 'Infrastructure',
      title: 'Transportation Infrastructure',
      description: 'Investment in roads, bridges, public transit, rail systems, and infrastructure modernization.',
      order: 12,
    },
    {
      category: 'Infrastructure',
      title: 'Broadband & Digital Infrastructure',
      description: 'Expanding high-speed internet access, especially in rural and underserved areas.',
      order: 13,
    },
    {
      category: 'Civil Rights',
      title: 'Voting Rights',
      description: 'Voter access, voting rights protections, election security, and electoral reform.',
      order: 14,
    },
    {
      category: 'Civil Rights',
      title: 'LGBTQ+ Rights',
      description: 'Anti-discrimination protections, marriage equality, and transgender rights.',
      order: 15,
    },
    {
      category: 'Civil Rights',
      title: 'Racial Justice',
      description: 'Policies addressing systemic racism, racial equity, and civil rights enforcement.',
      order: 16,
    },
    {
      category: 'Immigration',
      title: 'Immigration Reform',
      description: 'Pathways to citizenship, DACA, border security, and immigration enforcement policies.',
      order: 17,
    },
    {
      category: 'Foreign Policy',
      title: 'Military & Defense',
      description: 'Defense spending, military interventions, and national security strategy.',
      order: 18,
    },
    {
      category: 'Foreign Policy',
      title: 'International Relations',
      description: 'Foreign aid, diplomatic relations, trade agreements, and international alliances.',
      order: 19,
    },
    {
      category: 'Technology',
      title: 'Privacy & Data Protection',
      description: 'Consumer data privacy, tech company regulation, and digital rights.',
      order: 20,
    },
    {
      category: 'Technology',
      title: 'Net Neutrality',
      description: 'Keeping internet access open and preventing ISPs from blocking or throttling content.',
      order: 21,
    },
    {
      category: 'Gun Policy',
      title: 'Gun Control',
      description: 'Background checks, assault weapon bans, red flag laws, and firearm regulations.',
      order: 22,
    },
    {
      category: 'Healthcare',
      title: 'Reproductive Rights',
      description: 'Access to reproductive healthcare, abortion rights, and family planning services.',
      order: 23,
    },
    {
      category: 'Social Services',
      title: 'Social Safety Net',
      description: 'Social Security, Medicare, Medicaid, SNAP, and other social welfare programs.',
      order: 24,
    },
    {
      category: 'Housing',
      title: 'Affordable Housing',
      description: 'Housing affordability, rent control, homelessness prevention, and housing assistance programs.',
      order: 25,
    },
  ];

  console.log('📝 Creating stances...');
  for (const stance of stances) {
    await prisma.stance.upsert({
      where: {
        // Use a composite unique constraint on category + title
        id: '' // This won't match, so it will create
      },
      update: {},
      create: stance,
    });
  }

  console.log(`✅ Created ${stances.length} stances`);

  // Create a test admin user
  const bcrypt = await import('bcrypt');
  const adminPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@informedvoter.org' },
    update: {},
    create: {
      email: 'admin@informedvoter.org',
      passwordHash: adminPassword,
      name: 'Admin User',
      role: 'ADMIN',
    },
  });

  console.log('✅ Created admin user:', admin.email);

  // Create sample elections
  const upcomingElections = [
    {
      name: '2024 General Election',
      date: new Date('2024-11-05'),
      type: 'General',
      state: 'National',
      description: 'Federal, state, and local elections',
    },
    {
      name: '2024 Primary Election - California',
      date: new Date('2024-03-05'),
      type: 'Primary',
      state: 'CA',
      description: 'California primary elections',
    },
  ];

  console.log('📅 Creating elections...');
  for (const election of upcomingElections) {
    await prisma.election.upsert({
      where: { id: '' }, // Will create new
      update: {},
      create: election,
    });
  }

  console.log(`✅ Created ${upcomingElections.length} elections`);

  console.log('🎉 Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
