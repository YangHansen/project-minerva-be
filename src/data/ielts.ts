export const ieltsSeed = [
  // ==========================================
  // ACADEMIC TEST 1
  // ==========================================
  {
    setNumber: 1,
    order: 1,
    section: 'listening',
    title: 'Accommodation Enquiry',
    content: 'Man: Hello, accommodation agency. How can I help?\nWoman: I need a two-bedroom flat, fully furnished. My max budget is £850, but prefer £750.\nMan: I have one on Bridge Street for £800. It has a parking space.\nWoman: Great. Deposit?\nMan: £1200, plus a £50 agency fee.',
    audioUrl: 'https://example.com/audio/ielts-test-1-listening-part-1.mp3',
    questions: [
      { questionType: 'fill_in_the_blank', questionText: 'The woman wants a ________-bedroom flat.', correctAnswer: 'two', explanation: 'She explicitly asks for a two-bedroom flat.' },
      { questionType: 'fill_in_the_blank', questionText: 'The flat must be fully ________.', correctAnswer: 'furnished', explanation: 'She says she needs it fully furnished.' },
      { questionType: 'fill_in_the_blank', questionText: 'Maximum budget per month: £________.', correctAnswer: '850', explanation: 'Her stated maximum budget is 850.' },
      { questionType: 'fill_in_the_blank', questionText: 'The property on Bridge Street costs £________ per month.', correctAnswer: '800', explanation: 'The man offers a flat for £800.' },
      { questionType: 'multiple_choice', questionText: 'What extra feature does the flat have?', options: ['A garden', 'A parking space', 'A balcony'], correctAnswer: 'A parking space', explanation: 'The man mentions it includes a parking space.' },
    ],
  },
  {
    setNumber: 1,
    order: 2,
    section: 'reading',
    title: 'The Evolution of the Bicycle',
    content: 'The earliest predecessor to the bicycle was the "dandy horse," invented in 1817. It had no pedals. In the 1860s, the "velocipede" added pedals to the front wheel but was called a "boneshaker". The 1870s saw the penny-farthing, built for speed but dangerous. Finally, the "safety bicycle" in 1885 used a chain drive, and pneumatic tires in 1888 made it comfortable.',
    questions: [
      { questionType: 'fill_in_the_blank', questionText: 'The "dandy horse" was invented in ________.', correctAnswer: '1817', explanation: 'The text states it was invented in 1817.' },
      { questionType: 'true_false_not_given', questionText: 'The velocipede was very comfortable.', correctAnswer: 'False', explanation: 'It was known as a boneshaker because it was uncomfortable.' },
      { questionType: 'multiple_choice', questionText: 'The penny-farthing was built to increase ________.', options: ['comfort', 'speed', 'safety'], correctAnswer: 'speed', explanation: 'The large wheel was designed for speed.' },
      { questionType: 'matching', questionText: 'Match bicycle to feature: Safety Bicycle', options: ['No pedals', 'Chain drive'], correctAnswer: 'Chain drive', explanation: 'The safety bicycle used a chain drive.' },
    ],
  },
  {
    setNumber: 1,
    order: 3,
    section: 'writing',
    title: 'Writing Task 1: Bar Graph',
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
    content: 'Some believe technology leads to a loss of traditional cultures. Others argue it preserves them.\n\nDiscuss both views and give your opinion.',
    questions: [
      {
        questionType: 'essay',
        questionText: 'Write your essay here.',
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
    content: 'Librarian: What is your name?\nStudent: Jonathan Reeves.\nLibrarian: Address?\nStudent: 42 Westend Road, apartment 3B. Mobile is 07954 332 981.\nLibrarian: I need a passport or university ID.\nStudent: Here is my university ID.\nLibrarian: You can borrow 8 books for three weeks.',
    audioUrl: 'https://example.com/audio/ielts-test-2-listening-part-1.mp3',
    questions: [
      { questionType: 'fill_in_the_blank', questionText: 'The student\'s last name is ________.', correctAnswer: 'Reeves', explanation: 'He spells his name as Reeves.' },
      { questionType: 'fill_in_the_blank', questionText: 'The address is 42 ________ Road.', correctAnswer: 'Westend', explanation: 'Stated explicitly.' },
      { questionType: 'multiple_choice', questionText: 'How many books can Jonathan borrow at a time?', options: ['5', '8', '10'], correctAnswer: '8', explanation: 'The librarian says he can borrow 8 books.' },
      { questionType: 'true_false_not_given', questionText: 'Jonathan is a resident but not a student.', correctAnswer: 'False', explanation: 'He shows a university ID, confirming he is a student.' },
    ],
  },
  {
    setNumber: 2,
    order: 2,
    section: 'reading',
    title: 'Industrial Revolution',
    content: 'The Industrial Revolution began in Britain. People moved from rural areas to cities like Manchester, causing urbanization. Hastily built housing led to slums. The Factory Act of 1833 tried to regulate child labor. This era laid the groundwork for modern economies.',
    questions: [
      { questionType: 'multiple_choice', questionText: 'Where did the Industrial Revolution begin?', options: ['France', 'Germany', 'Britain'], correctAnswer: 'Britain', explanation: 'The passage explicitly states it began in Britain.' },
      { questionType: 'fill_in_the_blank', questionText: 'People moved from ________ areas to cities.', correctAnswer: 'rural', explanation: 'The text mentions moving from rural areas.' },
      { questionType: 'true_false_not_given', questionText: 'Working conditions were safe.', correctAnswer: 'False', explanation: 'Conditions led to slums and child labor regulation, implying they were unsafe.' },
      { questionType: 'fill_in_the_blank', questionText: 'The Factory Act of ________ regulated child labor.', correctAnswer: '1833', explanation: 'The date is given in the text.' },
    ],
  },
  {
    setNumber: 2,
    order: 3,
    section: 'writing',
    title: 'Writing Task 1: Line Graph',
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
    content: 'In many cities, private car use is increasing. Some believe the best way to solve traffic is to make public transport free.\n\nDo you agree or disagree?',
    questions: [
      {
        questionType: 'essay',
        questionText: 'Write your essay here.',
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
    content: 'Clerk: Welcome to City Gym. Are you looking to join?\nCustomer: Yes. I want the off-peak membership. How much is it?\nClerk: It is £30 a month, allowing access from 9 AM to 4 PM. You get access to the pool and sauna, but fitness classes cost an extra £5.\nCustomer: Perfect. I also need a locker.\nClerk: Lockers are £2 a week.',
    audioUrl: 'https://example.com/audio/ielts-test-3-listening-part-1.mp3',
    questions: [
      { questionType: 'fill_in_the_blank', questionText: 'The off-peak membership costs £________ a month.', correctAnswer: '30', explanation: 'The clerk states the price is £30.' },
      { questionType: 'multiple_choice', questionText: 'What is included for free in the off-peak membership?', options: ['Fitness classes', 'Pool and sauna', 'Lockers'], correctAnswer: 'Pool and sauna', explanation: 'Pool and sauna are included; classes and lockers cost extra.' },
      { questionType: 'fill_in_the_blank', questionText: 'Fitness classes cost an extra £________.', correctAnswer: '5', explanation: 'The clerk says classes cost an extra £5.' },
    ],
  },
  {
    setNumber: 3,
    order: 2,
    section: 'reading',
    title: 'The History of Chocolate',
    content: 'Chocolate originates from Mesoamerica, where the Maya and Aztecs cultivated cacao trees. They consumed it as a bitter beverage mixed with spices. When Spanish conquistadors brought it to Europe in the 16th century, sugar was added. In 1847, J.S. Fry & Sons created the first solid chocolate bar, transforming it into a mass-market treat.',
    questions: [
      { questionType: 'fill_in_the_blank', questionText: 'Chocolate originates from ________.', correctAnswer: 'Mesoamerica', explanation: 'The first sentence states this.' },
      { questionType: 'true_false_not_given', questionText: 'The Aztecs ate solid chocolate bars.', correctAnswer: 'False', explanation: 'They consumed it as a bitter beverage.' },
      { questionType: 'multiple_choice', questionText: 'Who created the first solid chocolate bar?', options: ['The Maya', 'Spanish conquistadors', 'J.S. Fry & Sons'], correctAnswer: 'J.S. Fry & Sons', explanation: 'J.S. Fry & Sons created it in 1847.' },
    ],
  },
  {
    setNumber: 3,
    order: 3,
    section: 'writing',
    title: 'Writing Task 1: Table',
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
    content: 'Space exploration requires vast sums of money. Some think this money should be spent on solving Earth\'s problems.\n\nDiscuss both views.',
    questions: [
      {
        questionType: 'essay',
        questionText: 'Write your essay here.',
        correctAnswer: '',
      },
    ],
  },
];
