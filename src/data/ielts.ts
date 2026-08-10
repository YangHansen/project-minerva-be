export interface IeltsQuestion {
  questionType: 'multiple_choice' | 'fill_in_the_blank' | 'true_false_not_given' | 'matching' | 'essay';
  questionText: string;
  options?: string[];
  correctAnswer: string;
  explanation?: string;
}

export interface IeltsExerciseData {
  testId: string;
  section: 'reading' | 'listening' | 'writing';
  partNumber: number;
  title: string;
  content: string;
  graphUrl?: string;
  audioUrl?: string;
  questions: IeltsQuestion[];
}

export const ieltsSeedData: IeltsExerciseData[] = [
  // ==========================================
  // ACADEMIC TEST 1
  // ==========================================
  {
    testId: 'academic-test-1', section: 'listening', partNumber: 1, title: 'Accommodation Enquiry',
    content: 'Man: Hello, accommodation agency. How can I help?\nWoman: I need a two-bedroom flat, fully furnished. My max budget is £850, but prefer £750.\nMan: I have one on Bridge Street for £800. It has a parking space.\nWoman: Great. Deposit?\nMan: £1200, plus a £50 agency fee.',
    audioUrl: 'https://example.com/audio/ielts-test-1-listening-part-1.mp3',
    questions: [
      { questionType: 'fill_in_the_blank', questionText: 'The woman wants a ________-bedroom flat.', correctAnswer: 'two', explanation: 'She explicitly asks for a two-bedroom flat.' },
      { questionType: 'fill_in_the_blank', questionText: 'The flat must be fully ________.', correctAnswer: 'furnished', explanation: 'She says she needs it fully furnished.' },
      { questionType: 'fill_in_the_blank', questionText: 'Maximum budget per month: £________.', correctAnswer: '850', explanation: 'Her stated maximum budget is 850.' },
      { questionType: 'fill_in_the_blank', questionText: 'The property on Bridge Street costs £________ per month.', correctAnswer: '800', explanation: 'The man offers a flat for £800.' },
      { questionType: 'multiple_choice', questionText: 'What extra feature does the flat have?', options: ['A garden', 'A parking space', 'A balcony'], correctAnswer: 'A parking space', explanation: 'The man mentions it includes a parking space.' }
    ]
  },
  {
    testId: 'academic-test-1', section: 'reading', partNumber: 1, title: 'The Evolution of the Bicycle',
    content: 'The earliest predecessor to the bicycle was the "dandy horse," invented in 1817. It had no pedals. In the 1860s, the "velocipede" added pedals to the front wheel but was called a "boneshaker". The 1870s saw the penny-farthing, built for speed but dangerous. Finally, the "safety bicycle" in 1885 used a chain drive, and pneumatic tires in 1888 made it comfortable.',
    questions: [
      { questionType: 'fill_in_the_blank', questionText: 'The "dandy horse" was invented in ________.', correctAnswer: '1817', explanation: 'The text states it was invented in 1817.' },
      { questionType: 'true_false_not_given', questionText: 'The velocipede was very comfortable.', correctAnswer: 'False', explanation: 'It was known as a boneshaker because it was uncomfortable.' },
      { questionType: 'multiple_choice', questionText: 'The penny-farthing was built to increase ________.', options: ['comfort', 'speed', 'safety'], correctAnswer: 'speed', explanation: 'The large wheel was designed for speed.' },
      { questionType: 'matching', questionText: 'Match bicycle to feature: Safety Bicycle', options: ['No pedals', 'Chain drive'], correctAnswer: 'Chain drive', explanation: 'The safety bicycle used a chain drive.' }
    ]
  },
  {
    testId: 'academic-test-1', section: 'writing', partNumber: 1, title: 'Writing Task 1: Bar Chart',
    content: 'The chart below shows global water usage by sector in 2000 and 2010.\n\nSummarise the information.',
    graphUrl: 'path/to/graph.png',
    questions: [
      { 
        questionType: 'essay', questionText: 'Write your response here.', 
        correctAnswer: 'The bar chart illustrates global water consumption across three sectors—agriculture, industry, and domestic use—in the years 2000 and 2010. Agriculture consistently accounted for the vast majority of water usage, although industrial and domestic usage saw proportional increases over the decade.' 
      }
    ]
  },
  {
    testId: 'academic-test-1', section: 'writing', partNumber: 2, title: 'Writing Task 2: Technology',
    content: 'Some believe technology leads to a loss of traditional cultures. Others argue it preserves them.\n\nDiscuss both views and give your opinion.',
    questions: [
      { 
        questionType: 'essay', questionText: 'Write your essay here.', 
        correctAnswer: 'Technology both threatens and preserves culture. While globalization spreads dominant cultures, digital archives and the internet allow marginalized groups to document and share their heritage globally. Overall, technology is a vital tool for cultural preservation.' 
      }
    ]
  },

  // ==========================================
  // ACADEMIC TEST 2
  // ==========================================
  {
    testId: 'academic-test-2', section: 'listening', partNumber: 1, title: 'Library Registration',
    content: 'Librarian: What is your name?\nStudent: Jonathan Reeves.\nLibrarian: Address?\nStudent: 42 Westend Road, apartment 3B. Mobile is 07954 332 981.\nLibrarian: I need a passport or university ID.\nStudent: Here is my university ID. \nLibrarian: You can borrow 8 books for three weeks.',
    audioUrl: 'https://example.com/audio/ielts-test-2-listening-part-1.mp3',
    questions: [
      { questionType: 'fill_in_the_blank', questionText: 'The student\'s last name is ________.', correctAnswer: 'Reeves', explanation: 'He spells his name as Reeves.' },
      { questionType: 'fill_in_the_blank', questionText: 'The address is 42 ________ Road.', correctAnswer: 'Westend', explanation: 'Stated explicitly.' },
      { questionType: 'multiple_choice', questionText: 'How many books can Jonathan borrow at a time?', options: ['5', '8', '10'], correctAnswer: '8', explanation: 'The librarian says he can borrow 8 books.' },
      { questionType: 'true_false_not_given', questionText: 'Jonathan is a resident but not a student.', correctAnswer: 'False', explanation: 'He shows a university ID, confirming he is a student.' }
    ]
  },
  {
    testId: 'academic-test-2', section: 'reading', partNumber: 2, title: 'Industrial Revolution',
    content: 'The Industrial Revolution began in Britain. People moved from rural areas to cities like Manchester, causing urbanization. Hastily built housing led to slums. The Factory Act of 1833 tried to regulate child labor. This era laid the groundwork for modern economies.',
    questions: [
      { questionType: 'multiple_choice', questionText: 'Where did the Industrial Revolution begin?', options: ['France', 'Germany', 'Britain'], correctAnswer: 'Britain', explanation: 'The passage explicitly states it began in Britain.' },
      { questionType: 'fill_in_the_blank', questionText: 'People moved from ________ areas to cities.', correctAnswer: 'rural', explanation: 'The text mentions moving from rural areas.' },
      { questionType: 'true_false_not_given', questionText: 'Working conditions were safe.', correctAnswer: 'False', explanation: 'Conditions led to slums and child labor regulation, implying they were unsafe.' },
      { questionType: 'fill_in_the_blank', questionText: 'The Factory Act of ________ regulated child labor.', correctAnswer: '1833', explanation: 'The date is given in the text.' }
    ]
  },
  {
    testId: 'academic-test-2', section: 'writing', partNumber: 2, title: 'Writing Task 2: Public Transport',
    content: 'In many cities, private car use is increasing. Some believe the best way to solve traffic is to make public transport free.\n\nDo you agree or disagree?',
    questions: [
      { 
        questionType: 'essay', questionText: 'Write your essay here.', 
        correctAnswer: 'While free public transport reduces cars on the road, it is financially unsustainable. A better approach is improving transit reliability while taxing private car usage via tolls.' 
      }
    ]
  },

  // ==========================================
  // ACADEMIC TEST 3
  // ==========================================
  {
    testId: 'academic-test-3', section: 'listening', partNumber: 1, title: 'Gym Membership',
    content: 'Clerk: Welcome to City Gym. Are you looking to join?\nCustomer: Yes. I want the off-peak membership. How much is it?\nClerk: It is £30 a month, allowing access from 9 AM to 4 PM. You get access to the pool and sauna, but fitness classes cost an extra £5.\nCustomer: Perfect. I also need a locker.\nClerk: Lockers are £2 a week.',
    audioUrl: 'https://example.com/audio/ielts-test-3-listening-part-1.mp3',
    questions: [
      { questionType: 'fill_in_the_blank', questionText: 'The off-peak membership costs £________ a month.', correctAnswer: '30', explanation: 'The clerk states the price is £30.' },
      { questionType: 'multiple_choice', questionText: 'What is included for free in the off-peak membership?', options: ['Fitness classes', 'Pool and sauna', 'Lockers'], correctAnswer: 'Pool and sauna', explanation: 'Pool and sauna are included; classes and lockers cost extra.' },
      { questionType: 'fill_in_the_blank', questionText: 'Fitness classes cost an extra £________.', correctAnswer: '5', explanation: 'The clerk says classes cost an extra £5.' }
    ]
  },
  {
    testId: 'academic-test-3', section: 'reading', partNumber: 1, title: 'The History of Chocolate',
    content: 'Chocolate originates from Mesoamerica, where the Maya and Aztecs cultivated cacao trees. They consumed it as a bitter beverage mixed with spices. When Spanish conquistadors brought it to Europe in the 16th century, sugar was added. In 1847, J.S. Fry & Sons created the first solid chocolate bar, transforming it into a mass-market treat.',
    questions: [
      { questionType: 'fill_in_the_blank', questionText: 'Chocolate originates from ________.', correctAnswer: 'Mesoamerica', explanation: 'The first sentence states this.' },
      { questionType: 'true_false_not_given', questionText: 'The Aztecs ate solid chocolate bars.', correctAnswer: 'False', explanation: 'They consumed it as a bitter beverage.' },
      { questionType: 'multiple_choice', questionText: 'Who created the first solid chocolate bar?', options: ['The Maya', 'Spanish conquistadors', 'J.S. Fry & Sons'], correctAnswer: 'J.S. Fry & Sons', explanation: 'J.S. Fry & Sons created it in 1847.' }
    ]
  },
  {
    testId: 'academic-test-3', section: 'writing', partNumber: 1, title: 'Writing Task 1: Bar Chart',
    content: 'The chart below shows global water usage by sector in 2000 and 2010.\n\nSummarise the information.',
    questions: [
      { 
        questionType: 'essay', questionText: 'Write your response here.', 
        correctAnswer: 'The bar chart illustrates global water consumption across three sectors—agriculture, industry, and domestic use—in the years 2000 and 2010. Agriculture consistently accounted for the vast majority of water usage, although industrial and domestic usage saw proportional increases over the decade.' 
      }
    ]
  },
  {
    testId: 'academic-test-3', section: 'writing', partNumber: 2, title: 'Writing Task 2: Space Exploration',
    content: 'Space exploration requires vast sums of money. Some think this money should be spent on solving Earth’s problems.\n\nDiscuss both views.',
    questions: [
      { 
        questionType: 'essay', questionText: 'Write your essay here.', 
        correctAnswer: 'Space exploration demands immense budgets, prompting debate over whether these funds should be diverted to terrestrial issues like poverty. While Earth faces urgent crises, space research yields crucial spin-off technologies and ensures humanity’s long-term survival.' 
      }
    ]
  },

  // ==========================================
  // ACADEMIC TEST 4
  // ==========================================
  {
    testId: 'academic-test-4', section: 'listening', partNumber: 1, title: 'Train Ticket Booking',
    content: 'Agent: Central Trains, how can I help?\nCaller: I need a return ticket from London to Manchester for tomorrow. Leaving around 10 AM.\nAgent: The 10:15 AM train arrives at 12:30 PM. A standard return is £65, but a first-class ticket is £95 and includes free Wi-Fi and lunch.\nCaller: I will take the standard ticket.',
    audioUrl: 'https://example.com/audio/ielts-test-4-listening-part-1.mp3',
    questions: [
      { questionType: 'fill_in_the_blank', questionText: 'The caller wants to travel from London to ________.', correctAnswer: 'Manchester', explanation: 'Stated by the caller.' },
      { questionType: 'fill_in_the_blank', questionText: 'The train arrives at ________ PM.', correctAnswer: '12:30', explanation: 'The agent states the arrival time.' },
      { questionType: 'true_false_not_given', questionText: 'The caller booked a first-class ticket.', correctAnswer: 'False', explanation: 'The caller says they will take the standard ticket.' }
    ]
  },
  {
    testId: 'academic-test-4', section: 'reading', partNumber: 1, title: 'Renewable Energy Sources',
    content: 'Renewable energy is derived from natural processes that are replenished constantly. Solar power converts sunlight into electricity using photovoltaic cells. Wind power utilizes turbines to generate kinetic energy. Hydroelectric power harnesses flowing water, usually via dams. These sources are crucial for reducing greenhouse gas emissions compared to fossil fuels.',
    questions: [
      { questionType: 'fill_in_the_blank', questionText: 'Solar power uses ________ cells.', correctAnswer: 'photovoltaic', explanation: 'Mentioned in the second sentence.' },
      { questionType: 'matching', questionText: 'Match energy source to its mechanism: Wind power', options: ['Photovoltaic cells', 'Turbines', 'Dams'], correctAnswer: 'Turbines', explanation: 'Wind power utilizes turbines.' },
      { questionType: 'true_false_not_given', questionText: 'Renewables produce more greenhouse gases than fossil fuels.', correctAnswer: 'False', explanation: 'They are crucial for reducing emissions compared to fossil fuels.' }
    ]
  },
  {
    testId: 'academic-test-4', section: 'writing', partNumber: 1, title: 'Writing Task 1: Line Graph',
    content: 'The graph shows the population growth of three cities from 1990 to 2020.\n\nSummarise the information.',
    questions: [
      { 
        questionType: 'essay', questionText: 'Write your response here.', 
        correctAnswer: 'The line graph details the population trajectories of three metropolitan areas over a 30-year period. While City A experienced steady, exponential growth, City B remained relatively stagnant, and City C saw a sharp decline after 2010.' 
      }
    ]
  },
  {
    testId: 'academic-test-4', section: 'writing', partNumber: 2, title: 'Writing Task 2: Fast Food',
    content: 'The consumption of fast food is increasing globally, leading to health issues. Should governments impose a higher tax on fast food?\n\nGive your opinion.',
    questions: [
      { 
        questionType: 'essay', questionText: 'Write your essay here.', 
        correctAnswer: 'The global rise in fast food consumption correlates directly with an obesity epidemic. Implementing a "fat tax" on unhealthy foods can effectively deter overconsumption while generating revenue for public healthcare initiatives, making it a necessary public health policy.' 
      }
    ]
  },

  // ==========================================
  // ACADEMIC TEST 5
  // ==========================================
  {
    testId: 'academic-test-5', section: 'listening', partNumber: 1, title: 'Hotel Reservation',
    content: 'Receptionist: Grand Hotel, good afternoon.\nGuest: I\'d like to book a double room for two nights, starting Friday.\nReceptionist: We have a sea-view room for £120 a night, or a standard room for £90. Breakfast is included in both.\nGuest: The sea-view room, please. Are pets allowed?\nReceptionist: Yes, but there is a £15 cleaning fee.',
    audioUrl: 'https://example.com/audio/ielts-test-5-listening-part-1.mp3',
    questions: [
      { questionType: 'fill_in_the_blank', questionText: 'The guest books a room for ________ nights.', correctAnswer: 'two', explanation: 'The guest specifies two nights.' },
      { questionType: 'multiple_choice', questionText: 'Which room does the guest choose?', options: ['Standard room', 'Sea-view room', 'Suite'], correctAnswer: 'Sea-view room', explanation: 'The guest says "The sea-view room, please."' },
      { questionType: 'true_false_not_given', questionText: 'Breakfast costs extra.', correctAnswer: 'False', explanation: 'Breakfast is included in both.' },
      { questionType: 'fill_in_the_blank', questionText: 'The pet cleaning fee is £________.', correctAnswer: '15', explanation: 'The receptionist states it is a £15 fee.' }
    ]
  },
  {
    testId: 'academic-test-5', section: 'reading', partNumber: 1, title: 'The Psychology of Colors',
    content: 'Color psychology studies how colors affect human behavior and mood. Red is often associated with urgency and passion, increasing heart rates. Blue is calming and is frequently used in corporate logos to instill trust. Green represents nature and tranquility, making it popular in healthcare settings. Yellow is energetic but can cause visual fatigue if overused.',
    questions: [
      { questionType: 'matching', questionText: 'Match color to its effect: Red', options: ['Urgency', 'Calming', 'Nature', 'Fatigue'], correctAnswer: 'Urgency', explanation: 'Red is associated with urgency.' },
      { questionType: 'matching', questionText: 'Match color to its effect: Blue', options: ['Urgency', 'Calming', 'Nature', 'Fatigue'], correctAnswer: 'Calming', explanation: 'Blue is calming.' },
      { questionType: 'true_false_not_given', questionText: 'Yellow is the best color for corporate logos.', correctAnswer: 'Not Given', explanation: 'The text says blue is used for corporate logos; it doesn\'t evaluate yellow for logos.' }
    ]
  },
  {
    testId: 'academic-test-5', section: 'writing', partNumber: 1, title: 'Writing Task 1: Map Comparison',
    content: 'The maps show a coastal town in 1990 and 2010.\n\nSummarise the changes.',
    questions: [
      { 
        questionType: 'essay', questionText: 'Write your response here.', 
        correctAnswer: 'The two maps illustrate the extensive development of a coastal town between 1990 and 2010. The most notable changes include the construction of a large marina replacing the old fishing dock, and the conversion of the northern forest area into a residential housing estate.' 
      }
    ]
  },
  {
    testId: 'academic-test-5', section: 'writing', partNumber: 2, title: 'Writing Task 2: Online Education',
    content: 'Online education is becoming more popular than traditional classroom learning. Is this a positive or negative development?\n\nGive your opinion.',
    questions: [
      { 
        questionType: 'essay', questionText: 'Write your essay here.', 
        correctAnswer: 'The shift towards online education offers unprecedented flexibility and accessibility to global learners. However, the lack of face-to-face interaction can hinder the development of soft skills and social cohesion among students. Ultimately, a hybrid approach combining both methods is optimal.' 
      }
    ]
  }
];