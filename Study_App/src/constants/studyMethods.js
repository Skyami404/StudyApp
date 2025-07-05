export const STUDY_METHODS = {
  pomodoro: { 
    name: 'Pomodoro', 
    duration: 25 * 60, // 25 minutes in seconds
    description: '25 minutes of focused work followed by a 5-minute break'
  },
  focus: { 
    name: 'Focus', 
    duration: 45 * 60, // 45 minutes
    description: '45 minutes of deep focus work'
  },
  deepwork: { 
    name: 'Deep Work', 
    duration: 90 * 60, // 90 minutes
    description: '90 minutes of intensive deep work session'
  },
  quick: {
    name: 'Quick Study',
    duration: 15 * 60, // 15 minutes
    description: '15 minutes for quick review or short tasks'
  },
  marathon: {
    name: 'Marathon',
    duration: 120 * 60, // 2 hours
    description: '2 hours for extended study sessions'
  }
};
