export const ieltsSeed = [
  // ==========================================
  // ACADEMIC TEST 1
  // ==========================================
  {
    setNumber: 1,
    order: 1,
    section: 'listening',
    title: 'Accommodation Enquiry',
    instruction: 'Complete the sentences below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.',
    content: 'Man: Hello, accommodation agency. How can I help?\nWoman: I need a two-bedroom flat, fully furnished. My max budget is £850, but prefer £750.\nMan: I have one on Bridge Street for £800. It has a parking space.\nWoman: Great. Deposit?\nMan: £1200, plus a £50 agency fee.',
    audioUrl: 'https://example.com/audio/ielts-test-1-listening-part-1.mp3',
    questions: [
      { questionType: 'fill_in_the_blank', questionText: 'The woman wants a ________-bedroom flat.', correctAnswer: 'two', explanation: 'She explicitly asks for a two-bedroom flat.' },
      { questionType: 'fill_in_the_blank', questionText: 'The flat must be fully ________.', correctAnswer: 'furnished', explanation: 'She says she needs it fully furnished.' },
      { questionType: 'fill_in_the_blank', questionText: 'Maximum budget per month: £________.', correctAnswer: '850', explanation: 'Her stated maximum budget is 850.' },
      { questionType: 'fill_in_the_blank', questionText: 'The property on Bridge Street costs £________ per month.', correctAnswer: '800', explanation: 'The man offers a flat for £800.' },
      { questionType: 'fill_in_the_blank', questionText: 'The flat has a ________ space.', correctAnswer: 'parking', explanation: 'The man mentions it includes a parking space.' },
    ],
  },
  {
    setNumber: 1,
    order: 2,
    section: 'reading',
    title: 'The Evolution of the Bicycle',
    instruction: 'Complete the sentences below. Write NO MORE THAN TWO WORDS for each answer.',
    content: 'The earliest predecessor to the bicycle was the "dandy horse," invented in 1817. It had no pedals. In the 1860s, the "velocipede" added pedals to the front wheel but was called a "boneshaker". The 1870s saw the penny-farthing, built for speed but dangerous. Finally, the "safety bicycle" in 1885 used a chain drive, and pneumatic tires in 1888 made it comfortable.',
    questions: [
      { questionType: 'fill_in_the_blank', questionText: 'The "dandy horse" was invented in ________.', correctAnswer: '1817', explanation: 'The text states it was invented in 1817.' },
      { questionType: 'fill_in_the_blank', questionText: 'The "velocipede" added pedals to the front ________.', correctAnswer: 'wheel', explanation: 'The text says pedals were added to the front wheel.' },
      { questionType: 'fill_in_the_blank', questionText: 'The "safety bicycle" was invented in ________.', correctAnswer: '1885', explanation: 'The text states the safety bicycle appeared in 1885.' },
      { questionType: 'fill_in_the_blank', questionText: 'Pneumatic tires made the bicycle ________.', correctAnswer: 'comfortable', explanation: 'The text says pneumatic tires made it comfortable.' },
      { questionType: 'fill_in_the_blank', questionText: 'The "velocipede" was also called a "________".', correctAnswer: 'boneshaker', explanation: 'The text mentions it was called a boneshaker.' },
    ],
  },
  {
    setNumber: 1,
    order: 3,
    section: 'writing',
    title: 'Writing Task 1: Bar Graph',
    instruction: 'You should spend about 20 minutes on this task. Write at least 150 words.',
    content: 'The bar chart shows the expenditure of two countries on consumer goods in 2010.',
    graphUrl: 'https://drive.google.com/file/d/13vCSBEwgUriL8sF2yQxpSXtR5sgEAFnU/view?usp=sharing',
    questions: [
      {
        questionType: 'essay',
        questionText: 'Based on the graph, you must write a report of at least 150 words.',
        correctAnswer: '',
      },
    ],
  },
  {
    setNumber: 1,
    order: 4,
    section: 'writing',
    title: 'Writing Task 2: Technology',
    instruction: 'You should spend about 40 minutes on this task. Write at least 250 words.',
    content: 'Some believe technology leads to a loss of traditional cultures. Others argue it preserves them.\n\nDiscuss both views and give your opinion.',
    questions: [
      {
        questionType: 'essay',
        questionText: 'Write your essay here.',
        correctAnswer: '',
      },
    ],
  },
  {
    setNumber: 1,
    order: 5,
    section: 'speaking',
    title: 'Speaking Part 1: Introduction and Interview',
    content: 'In this first part, the examiner will ask you some questions about yourself. Let\'s talk about your hometown. Where is your hometown located? What do you find most interesting about your hometown? Would you say it is a good place to live?',
    questions: [
      {
        questionType: 'essay',
        correctAnswer: '',
      },
    ],
  },
  {
    setNumber: 1,
    order: 6,
    section: 'speaking',
    title: 'Speaking Part 2: Long Turn',
    content: 'You will have 1 minute to prepare and 1 to 2 minutes to talk. Describe a memorable journey you have made. You should say: where you went, how you traveled, who you went with, and explain why this journey was so memorable to you.',
    questions: [
      {
        questionType: 'essay',
        correctAnswer: '',
      },
    ],
  },
  {
    setNumber: 1,
    order: 7,
    section: 'speaking',
    title: 'Speaking Part 3: Two-Way Discussion',
    content: 'We have been talking about a memorable journey, and now I would like to discuss with you some more general questions related to this topic. How has the way people travel changed over the last few decades? What do you think are the environmental impacts of modern tourism?',
    questions: [
      {
        questionType: 'essay',
        correctAnswer: '',
      },
    ],
  },

  // ==========================================
  // ACADEMIC TEST 2
  // ==========================================
  {
    setNumber: 2,
    order: 1,
    section: 'listening',
    title: 'Library Registration',
    instruction: 'Complete the sentences below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.',
    content: 'Librarian: What is your name?\nStudent: Jonathan Reeves.\nLibrarian: Address?\nStudent: 42 Westend Road, apartment 3B. Mobile is 07954 332 981.\nLibrarian: I need a passport or university ID.\nStudent: Here is my university ID.\nLibrarian: You can borrow 8 books for three weeks.',
    audioUrl: 'https://example.com/audio/ielts-test-2-listening-part-1.mp3',
    questions: [
      { questionType: 'fill_in_the_blank', questionText: 'The student\'s last name is ________.', correctAnswer: 'Reeves', explanation: 'He spells his name as Reeves.' },
      { questionType: 'fill_in_the_blank', questionText: 'The address is 42 ________ Road.', correctAnswer: 'Westend', explanation: 'Stated explicitly.' },
      { questionType: 'fill_in_the_blank', questionText: 'Jonathan can borrow ________ books at a time.', correctAnswer: '8', explanation: 'The librarian says he can borrow 8 books.' },
      { questionType: 'fill_in_the_blank', questionText: 'Jonathan is a ________.', correctAnswer: 'student', explanation: 'He shows a university ID, confirming he is a student.' },
      { questionType: 'fill_in_the_blank', questionText: 'The loan period is ________ weeks.', correctAnswer: 'three', explanation: 'The librarian says he can borrow the books for three weeks.' },
    ],
  },
  {
    setNumber: 2,
    order: 2,
    section: 'reading',
    title: 'Industrial Revolution',
    instruction: 'Do the following statements agree with the information given in the passage? Write TRUE, FALSE or NOT GIVEN.',
    content: 'The Industrial Revolution began in Britain. People moved from rural areas to cities like Manchester, causing urbanization. Hastily built housing led to slums. The Factory Act of 1833 tried to regulate child labor. This era laid the groundwork for modern economies.',
    questions: [
      { questionType: 'true_false_not_given', questionText: 'The Industrial Revolution began in France.', correctAnswer: 'False', explanation: 'The text states it began in Britain.' },
      { questionType: 'true_false_not_given', questionText: 'People moved from rural areas to cities.', correctAnswer: 'True', explanation: 'The text explicitly states people moved from rural areas to cities.' },
      { questionType: 'true_false_not_given', questionText: 'Working conditions were safe.', correctAnswer: 'False', explanation: 'Conditions led to slums and child labor regulation, implying they were unsafe.' },
      { questionType: 'true_false_not_given', questionText: 'The Factory Act of 1833 regulated child labor.', correctAnswer: 'True', explanation: 'The text states the Factory Act of 1833 tried to regulate child labor.' },
      { questionType: 'true_false_not_given', questionText: 'The Industrial Revolution had no impact on modern economies.', correctAnswer: 'False', explanation: 'The text says this era laid the groundwork for modern economies.' },
    ],
  },
  {
    setNumber: 2,
    order: 3,
    section: 'writing',
    title: 'Writing Task 1: Line Graph',
    instruction: 'You should spend about 20 minutes on this task. Write at least 150 words.',
    content: 'The graph below shows the consumption of three kinds of spreads between 1981 and 2007.',
    graphUrl: 'https://drive.google.com/file/d/1LZhJ74zr8Bzzccuv746YlYeWhNzNuvkB/view?usp=sharing',
    questions: [
      {
        questionType: 'essay',
        questionText: 'Based on the graph, you must write a report of at least 150 words.',
        correctAnswer: '',
      },
    ],
  },
  {
    setNumber: 2,
    order: 4,
    section: 'writing',
    title: 'Writing Task 2: Public Transport',
    instruction: 'You should spend about 40 minutes on this task. Write at least 250 words.',
    content: 'In many cities, private car use is increasing. Some believe the best way to solve traffic is to make public transport free.\n\nDo you agree or disagree?',
    questions: [
      {
        questionType: 'essay',
        questionText: 'Write your essay here.',
        correctAnswer: '',
      },
    ],
  },
  {
    setNumber: 2,
    order: 5,
    section: 'speaking',
    title: 'Speaking Part 1: Introduction and Interview',
    content: 'In this first part, the examiner will ask you some questions about yourself. Let\'s talk about your free time. What do you usually do on the weekends? Do you prefer spending your free time alone or with friends? How have your hobbies changed since you were a child?',
    questions: [
      {
        questionType: 'essay',
        correctAnswer: '',
      },
    ],
  },
  {
    setNumber: 2,
    order: 6,
    section: 'speaking',
    title: 'Speaking Part 2: Long Turn',
    content: 'You will have 1 minute to prepare and 1 to 2 minutes to talk. Describe a book or movie that had a strong impact on you. You should say: what it is, when you read or watched it, what it is about, and explain why it had such a strong impact on you.',
    questions: [
      {
        questionType: 'essay',
        correctAnswer: '',
      },
    ],
  },
  {
    setNumber: 2,
    order: 7,
    section: 'speaking',
    title: 'Speaking Part 3: Two-Way Discussion',
    content: 'We\'ve been talking about a book or movie that impacted you. Let\'s consider some broader questions about entertainment. Do you think people read fewer books now than they did in the past? How do you think the film industry influences our culture and society?',
    questions: [
      {
        questionType: 'essay',
        correctAnswer: '',
      },
    ],
  },

  // ==========================================
  // ACADEMIC TEST 3
  // ==========================================
  {
    setNumber: 3,
    order: 1,
    section: 'listening',
    title: 'Gym Membership',
    instruction: 'Complete the sentences below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.',
    content: 'Clerk: Welcome to City Gym. Are you looking to join?\nCustomer: Yes. I want the off-peak membership. How much is it?\nClerk: It is £30 a month, allowing access from 9 AM to 4 PM. You get access to the pool and sauna, but fitness classes cost an extra £5.\nCustomer: Perfect. I also need a locker.\nClerk: Lockers are £2 a week.',
    audioUrl: 'https://example.com/audio/ielts-test-3-listening-part-1.mp3',
    questions: [
      { questionType: 'fill_in_the_blank', questionText: 'The off-peak membership costs £________ a month.', correctAnswer: '30', explanation: 'The clerk states the price is £30.' },
      { questionType: 'fill_in_the_blank', questionText: 'The membership includes a ________ and sauna.', correctAnswer: 'pool', explanation: 'Pool and sauna are included; classes and lockers cost extra.' },
      { questionType: 'fill_in_the_blank', questionText: 'Fitness classes cost an extra £________.', correctAnswer: '5', explanation: 'The clerk says classes cost an extra £5.' },
      { questionType: 'fill_in_the_blank', questionText: 'Access is allowed from ________ AM to 4 PM.', correctAnswer: '9', explanation: 'The clerk says access is available from 9 AM to 4 PM.' },
      { questionType: 'fill_in_the_blank', questionText: 'The customer also needs a ________.', correctAnswer: 'locker', explanation: 'The customer says they also need a locker.' },
      { questionType: 'fill_in_the_blank', questionText: 'Lockers cost £________ a week.', correctAnswer: '2', explanation: 'The clerk says lockers are £2 a week.' },
    ],
  },
  {
    setNumber: 3,
    order: 2,
    section: 'reading',
    title: 'The History of Chocolate',
    instruction: 'Choose the correct letter, A, B or C.',
    content: 'Chocolate originates from Mesoamerica, where the Maya and Aztecs cultivated cacao trees. They consumed it as a bitter beverage mixed with spices. When Spanish conquistadors brought it to Europe in the 16th century, sugar was added. In 1847, J.S. Fry & Sons created the first solid chocolate bar, transforming it into a mass-market treat.',
    questions: [
      { questionType: 'multiple_choice', questionText: 'Where does chocolate originate from?', options: ['Europe', 'Mesoamerica', 'Africa'], correctAnswer: 'Mesoamerica', explanation: 'The text states chocolate originates from Mesoamerica.' },
      { questionType: 'multiple_choice', questionText: 'How did the Maya and Aztecs consume chocolate?', options: ['As a solid bar', 'As a bitter beverage', 'As a sweet dessert'], correctAnswer: 'As a bitter beverage', explanation: 'They consumed it as a bitter beverage mixed with spices.' },
      { questionType: 'multiple_choice', questionText: 'Who created the first solid chocolate bar?', options: ['The Maya', 'Spanish conquistadors', 'J.S. Fry & Sons'], correctAnswer: 'J.S. Fry & Sons', explanation: 'J.S. Fry & Sons created it in 1847.' },
      { questionType: 'multiple_choice', questionText: 'When was sugar added to chocolate?', options: ['In the 16th century', 'In 1847', 'In the 19th century'], correctAnswer: 'In the 16th century', explanation: 'Sugar was added when Spanish conquistadors brought it to Europe in the 16th century.' },
      { questionType: 'multiple_choice', questionText: 'What did the Maya and Aztecs cultivate?', options: ['Sugar cane', 'Cacao trees', 'Coffee plants'], correctAnswer: 'Cacao trees', explanation: 'The text states they cultivated cacao trees.' },
    ],
  },
  {
    setNumber: 3,
    order: 3,
    section: 'writing',
    title: 'Writing Task 1: Table',
    instruction: 'You should spend about 20 minutes on this task. Write at least 150 words.',
    content: 'The table shows the proportion of income spent on 4 common items in the UK in 1998.',
    graphUrl: 'https://drive.google.com/file/d/1Q2z8foAYE_O0DvqVlmV5LEKmOjwp6zHo/view?usp=sharing',
    questions: [
      {
        questionType: 'essay',
        questionText: 'Based on the table, you must write a report of at least 150 words.',
        correctAnswer: '',
      },
    ],
  },
  {
    setNumber: 3,
    order: 4,
    section: 'writing',
    title: 'Writing Task 2: Space Exploration',
    instruction: 'You should spend about 40 minutes on this task. Write at least 250 words.',
    content: 'Space exploration requires vast sums of money. Some think this money should be spent on solving Earth\'s problems.\n\nDiscuss both views.',
    questions: [
      {
        questionType: 'essay',
        questionText: 'Write your essay here.',
        correctAnswer: '',
      },
    ],
  },
  {
    setNumber: 3,
    order: 5,
    section: 'speaking',
    title: 'Speaking Part 1: Introduction and Interview',
    content: 'In this first part, the examiner will ask you some questions about yourself. Let\'s talk about your work or studies. Do you work or are you currently a student? What is the most difficult part of your job or studies? Is there anything you would like to change about your daily routine?',
    questions: [
      {
        questionType: 'essay',
        correctAnswer: '',
      },
    ],
  },
  {
    setNumber: 3,
    order: 6,
    section: 'speaking',
    title: 'Speaking Part 2: Long Turn',
    content: 'You will have 1 minute to prepare and 1 to 2 minutes to talk. Describe a successful person that you admire. You should say: who this person is, how you know about them, what they have achieved, and explain why you consider them to be successful.',
    questions: [
      {
        questionType: 'essay',
        correctAnswer: '',
      },
    ],
  },
  {
    setNumber: 3,
    order: 7,
    section: 'speaking',
    title: 'Speaking Part 3: Two-Way Discussion',
    content: 'We have been discussing a successful person you admire. Let\'s explore the concept of success further. How is success typically measured in your culture? Do you think financial wealth is the most important indicator of a successful life, or are there better ways to measure it?',
    questions: [
      {
        questionType: 'essay',
        correctAnswer: '',
      },
    ],
  },

  // ==========================================
  // ACADEMIC TEST 4
  // ==========================================
  {
    setNumber: 4,
    order: 1,
    section: 'listening',
    title: 'Train Ticket Booking',
    instruction: 'Complete the sentences below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.',
    content: 'Agent: Central Trains, how can I help?\nCaller: I need a return ticket from London to Manchester for tomorrow. Leaving around 10 AM.\nAgent: The 10:15 AM train arrives at 12:30 PM. A standard return is £65, but a first-class ticket is £95 and includes free Wi-Fi and lunch.\nCaller: I will take the standard ticket.',
    audioUrl: 'https://example.com/audio/ielts-test-4-listening-part-1.mp3',
    questions: [
      { questionType: 'fill_in_the_blank', questionText: 'The caller wants to travel from London to ________.', correctAnswer: 'Manchester', explanation: 'Stated by the caller.' },
      { questionType: 'fill_in_the_blank', questionText: 'The train arrives at ________ PM.', correctAnswer: '12:30', explanation: 'The agent states the arrival time.' },
      { questionType: 'fill_in_the_blank', questionText: 'A standard return ticket costs £________.', correctAnswer: '65', explanation: 'The agent states a standard return is £65.' },
      { questionType: 'fill_in_the_blank', questionText: 'The caller chose the ________ ticket.', correctAnswer: 'standard', explanation: 'The caller says they will take the standard ticket.' },
      { questionType: 'fill_in_the_blank', questionText: 'First-class tickets include free Wi-Fi and ________.', correctAnswer: 'lunch', explanation: 'The agent mentions first-class includes free Wi-Fi and lunch.' },
    ],
  },
  {
    setNumber: 4,
    order: 2,
    section: 'reading',
    title: 'Renewable Energy Sources',
    instruction: 'Complete the sentences below. Write NO MORE THAN TWO WORDS for each answer.',
    content: 'Renewable energy is derived from natural processes that are replenished constantly. Solar power converts sunlight into electricity using photovoltaic cells. Wind power utilizes turbines to generate kinetic energy. Hydroelectric power harnesses flowing water, usually via dams. These sources are crucial for reducing greenhouse gas emissions compared to fossil fuels.',
    questions: [
      { questionType: 'fill_in_the_blank', questionText: 'Solar power uses ________ cells.', correctAnswer: 'photovoltaic', explanation: 'Mentioned in the second sentence.' },
      { questionType: 'fill_in_the_blank', questionText: 'Wind power utilizes ________ to generate kinetic energy.', correctAnswer: 'turbines', explanation: 'The text states wind power utilizes turbines.' },
      { questionType: 'fill_in_the_blank', questionText: 'Hydroelectric power harnesses flowing ________.', correctAnswer: 'water', explanation: 'The text mentions harnessing flowing water.' },
      { questionType: 'fill_in_the_blank', questionText: 'Renewable energy sources are crucial for reducing ________ gas emissions.', correctAnswer: 'greenhouse', explanation: 'The text says they reduce greenhouse gas emissions.' },
      { questionType: 'fill_in_the_blank', questionText: 'Hydroelectric power usually uses ________ to harness water.', correctAnswer: 'dams', explanation: 'The text states it is usually via dams.' },
    ],
  },
  {
    setNumber: 4,
    order: 3,
    section: 'writing',
    title: 'Writing Task 1: Line Graph',
    instruction: 'You should spend about 20 minutes on this task. Write at least 150 words.',
    graphUrl: 'https://drive.google.com/file/d/1pqq1sAjLMreiQaP9dXxLdkDWrQBrRDBG/view?usp=sharing',
    content: 'The line graph below shows the consumption of 4 kinds of meat in a European country from 1979 to 2004.',
    questions: [
      {
        questionType: 'essay',
        questionText: 'Based on the graph, you must write a report of at least 150 words.',
        correctAnswer: '',
      },
    ],
  },
  {
    setNumber: 4,
    order: 4,
    section: 'writing',
    title: 'Writing Task 2: Fast Food',
    instruction: 'You should spend about 40 minutes on this task. Write at least 250 words.',
    content: 'The consumption of fast food is increasing globally, leading to health issues. Should governments impose a higher tax on fast food?\n\nGive your opinion.',
    questions: [
      {
        questionType: 'essay',
        questionText: 'Write your essay here.',
        correctAnswer: '',
      },
    ],
  },
  {
    setNumber: 4,
    order: 5,
    section: 'speaking',
    title: 'Speaking Part 1: Introduction and Interview',
    content: 'In this first part, the examiner will ask you some questions about yourself. Let\'s talk about food and cooking. Do you enjoy cooking? What is your favourite meal to prepare? How often do you eat out at restaurants?',
    questions: [
      {
        questionType: 'essay',
        correctAnswer: '',
      },
    ],
  },
  {
    setNumber: 4,
    order: 6,
    section: 'speaking',
    title: 'Speaking Part 2: Long Turn',
    content: 'You will have 1 minute to prepare and 1 to 2 minutes to talk. Describe a place where you go to relax. You should say: where it is, how often you go there, what you do there, and explain why it helps you relax.',
    questions: [
      {
        questionType: 'essay',
        correctAnswer: '',
      },
    ],
  },
  {
    setNumber: 4,
    order: 7,
    section: 'speaking',
    title: 'Speaking Part 3: Two-Way Discussion',
    content: 'We have been talking about a place where you relax. Let\'s consider some broader questions about well-being. Why do modern people feel more stressed than previous generations? What role does exercise play in managing stress?',
    questions: [
      {
        questionType: 'essay',
        correctAnswer: '',
      },
    ],
  }
];
