// mood-recommendation.js

// 1. MOOD-BASED DATASET
// These are simplified datasets for demo purposes
const moodBasedData = {
    // 10 different moods with corresponding music and movie recommendations
    moods: [
      'happy',
      'sad',
      'energetic',
      'relaxed',
      'anxious',
      'focused',
      'romantic',
      'angry',
      'nostalgic',
      'inspired'
    ],
    
    // Music recommendations for each mood
    musicRecommendations: {
      happy: [
        { title: "Happy", artist: "Pharrell Williams", genre: "Pop" },
        { title: "Good as Hell", artist: "Lizzo", genre: "Pop" },
        { title: "Walking on Sunshine", artist: "Katrina & The Waves", genre: "Pop" },
        { title: "Uptown Funk", artist: "Mark Ronson ft. Bruno Mars", genre: "Funk" },
        { title: "Can't Stop the Feeling!", artist: "Justin Timberlake", genre: "Pop" }
      ],
      sad: [
        { title: "Fix You", artist: "Coldplay", genre: "Alternative" },
        { title: "Someone Like You", artist: "Adele", genre: "Pop" },
        { title: "Rise Up", artist: "Andra Day", genre: "R&B" },
        { title: "Brave", artist: "Sara Bareilles", genre: "Pop" },
        { title: "Fight Song", artist: "Rachel Platten", genre: "Pop" }
      ],
      energetic: [
        { title: "Eye of the Tiger", artist: "Survivor", genre: "Rock" },
        { title: "Stronger", artist: "Kanye West", genre: "Hip-Hop" },
        { title: "Don't Stop Me Now", artist: "Queen", genre: "Rock" },
        { title: "Can't Hold Us", artist: "Macklemore & Ryan Lewis", genre: "Hip-Hop" },
        { title: "Thunderclouds", artist: "LSD", genre: "Pop" }
      ],
      relaxed: [
        { title: "Someone You Loved", artist: "Lewis Capaldi", genre: "Pop" },
        { title: "Weightless", artist: "Marconi Union", genre: "Ambient" },
        { title: "Claire de Lune", artist: "Claude Debussy", genre: "Classical" },
        { title: "Tenerife Sea", artist: "Ed Sheeran", genre: "Pop" },
        { title: "River Flows in You", artist: "Yiruma", genre: "Piano" }
      ],
      anxious: [
        { title: "Breathe Me", artist: "Sia", genre: "Pop" },
        { title: "Weightless", artist: "Marconi Union", genre: "Ambient" },
        { title: "Everything's Alright", artist: "Laura Shigihara", genre: "Indie" },
        { title: "Orinoco Flow", artist: "Enya", genre: "New Age" },
        { title: "Don't Worry Be Happy", artist: "Bobby McFerrin", genre: "Jazz" }
      ],
      focused: [
        { title: "Experience", artist: "Ludovico Einaudi", genre: "Classical" },
        { title: "Time", artist: "Hans Zimmer", genre: "Soundtrack" },
        { title: "Strobe", artist: "Deadmau5", genre: "Electronic" },
        { title: "Brain Food", artist: "Chillhop Radio", genre: "Lo-fi" },
        { title: "Alpha Waves", artist: "Binaural Beats", genre: "Ambient" }
      ],
      romantic: [
        { title: "Perfect", artist: "Ed Sheeran", genre: "Pop" },
        { title: "All of Me", artist: "John Legend", genre: "R&B" },
        { title: "Thinking Out Loud", artist: "Ed Sheeran", genre: "Pop" },
        { title: "At Last", artist: "Etta James", genre: "Jazz" },
        { title: "Just the Way You Are", artist: "Bruno Mars", genre: "Pop" }
      ],
      angry: [
        { title: "Break Stuff", artist: "Limp Bizkit", genre: "Rock" },
        { title: "Till I Collapse", artist: "Eminem", genre: "Hip-Hop" },
        { title: "Numb", artist: "Linkin Park", genre: "Rock" },
        { title: "Uprising", artist: "Muse", genre: "Rock" },
        { title: "I Will Survive", artist: "Gloria Gaynor", genre: "Disco" }
      ],
      nostalgic: [
        { title: "Vienna", artist: "Billy Joel", genre: "Rock" },
        { title: "Landslide", artist: "Fleetwood Mac", genre: "Rock" },
        { title: "Fast Car", artist: "Tracy Chapman", genre: "Folk" },
        { title: "Yesterday", artist: "The Beatles", genre: "Rock" },
        { title: "Time After Time", artist: "Cyndi Lauper", genre: "Pop" }
      ],
      inspired: [
        { title: "Hall of Fame", artist: "The Script", genre: "Pop Rock" },
        { title: "Roar", artist: "Katy Perry", genre: "Pop" },
        { title: "This Is Me", artist: "Keala Settle", genre: "Soundtrack" },
        { title: "Unstoppable", artist: "Sia", genre: "Pop" },
        { title: "Firework", artist: "Katy Perry", genre: "Pop" }
      }
    },
    
    // Movie recommendations for each mood
    movieRecommendations: {
      happy: [
        { title: "La La Land", genre: "Musical", year: 2016 },
        { title: "The Secret Life of Walter Mitty", genre: "Adventure", year: 2013 },
        { title: "Little Miss Sunshine", genre: "Comedy", year: 2006 },
        { title: "Forrest Gump", genre: "Drama", year: 1994 },
        { title: "The Pursuit of Happyness", genre: "Drama", year: 2006 }
      ],
      sad: [
        { title: "Soul", genre: "Animation", year: 2020 },
        { title: "Inside Out", genre: "Animation", year: 2015 },
        { title: "Good Will Hunting", genre: "Drama", year: 1997 },
        { title: "The Shawshank Redemption", genre: "Drama", year: 1994 },
        { title: "Wonder", genre: "Drama", year: 2017 }
      ],
      energetic: [
        { title: "Baby Driver", genre: "Action", year: 2017 },
        { title: "Mad Max: Fury Road", genre: "Action", year: 2015 },
        { title: "John Wick", genre: "Action", year: 2014 },
        { title: "The Fast and the Furious", genre: "Action", year: 2001 },
        { title: "Mission: Impossible - Fallout", genre: "Action", year: 2018 }
      ],
      relaxed: [
        { title: "The Secret Garden", genre: "Drama", year: 2020 },
        { title: "Chef", genre: "Comedy", year: 2014 },
        { title: "Pride & Prejudice", genre: "Romance", year: 2005 },
        { title: "About Time", genre: "Romance", year: 2013 },
        { title: "Julie & Julia", genre: "Drama", year: 2009 }
      ],
      anxious: [
        { title: "The Darjeeling Limited", genre: "Comedy-Drama", year: 2007 },
        { title: "Eat Pray Love", genre: "Drama", year: 2010 },
        { title: "Amélie", genre: "Romance", year: 2001 },
        { title: "Big Fish", genre: "Adventure", year: 2003 },
        { title: "Spirited Away", genre: "Animation", year: 2001 }
      ],
      focused: [
        { title: "A Beautiful Mind", genre: "Biography", year: 2001 },
        { title: "The Imitation Game", genre: "Drama", year: 2014 },
        { title: "The Social Network", genre: "Drama", year: 2010 },
        { title: "Whiplash", genre: "Drama", year: 2014 },
        { title: "The Theory of Everything", genre: "Biography", year: 2014 }
      ],
      romantic: [
        { title: "The Notebook", genre: "Romance", year: 2004 },
        { title: "Before Sunrise", genre: "Romance", year: 1995 },
        { title: "Crazy Rich Asians", genre: "Romance", year: 2018 },
        { title: "10 Things I Hate About You", genre: "Romance", year: 1999 },
        { title: "Love, Simon", genre: "Romance", year: 2018 }
      ],
      angry: [
        { title: "The Dark Knight", genre: "Action", year: 2008 },
        { title: "Django Unchained", genre: "Western", year: 2012 },
        { title: "Inglourious Basterds", genre: "War", year: 2009 },
        { title: "Fight Club", genre: "Drama", year: 1999 },
        { title: "The Godfather", genre: "Crime", year: 1972 }
      ],
      nostalgic: [
        { title: "Stand By Me", genre: "Drama", year: 1986 },
        { title: "The Breakfast Club", genre: "Comedy-Drama", year: 1985 },
        { title: "Ferris Bueller's Day Off", genre: "Comedy", year: 1986 },
        { title: "Back to the Future", genre: "Sci-Fi", year: 1985 },
        { title: "Cinema Paradiso", genre: "Drama", year: 1988 }
      ],
      inspired: [
        { title: "Dead Poets Society", genre: "Drama", year: 1989 },
        { title: "The King's Speech", genre: "Biography", year: 2010 },
        { title: "Hidden Figures", genre: "Drama", year: 2016 },
        { title: "The Intouchables", genre: "Comedy-Drama", year: 2011 },
        { title: "Searching for Sugar Man", genre: "Documentary", year: 2012 }
      ]
    }
  };
  
  // 2. SIMPLE ML MODEL FOR RECOMMENDATIONS
  class MoodBasedRecommendationModel {
    constructor(dataset) {
      this.dataset = dataset;
      this.trainedModel = this.trainModel();
    }
  
    // This is a simplified "training" process that just loads our dataset
    trainModel() {
      return {
        // For each user mood, return a function that gives recommendations
        predict: (userMood) => {
          // Convert user input to lowercase and find the closest mood
          const normalizedMood = userMood.toLowerCase();
          const closestMood = this.findClosestMood(normalizedMood);
          
          // Get recommendations for the closest mood
          return {
            musicRecommendations: this.dataset.musicRecommendations[closestMood] || [],
            movieRecommendations: this.dataset.movieRecommendations[closestMood] || []
          };
        }
      };
    }
  
    // Find the closest mood from our dataset based on user input
    findClosestMood(userMood) {
      // For exact matches
      if (this.dataset.moods.includes(userMood)) {
        return userMood;
      }
      
      // For approximate matches using simple word association
      // In a real ML model, you'd use word embeddings or a more sophisticated approach
      const moodAssociations = {
        'cheerful': 'happy',
        'joyful': 'happy',
        'excited': 'happy',
        'depressed': 'sad',
        'melancholy': 'sad',
        'down': 'sad',
        'blue': 'sad',
        'active': 'energetic',
        'lively': 'energetic',
        'pumped': 'energetic',
        'calm': 'relaxed',
        'peaceful': 'relaxed',
        'tranquil': 'relaxed',
        'worried': 'anxious',
        'stressed': 'anxious',
        'nervous': 'anxious',
        'concentrated': 'focused',
        'studious': 'focused',
        'productive': 'focused',
        'love': 'romantic',
        'passionate': 'romantic',
        'affectionate': 'romantic',
        'mad': 'angry',
        'furious': 'angry',
        'enraged': 'angry',
        'reminiscent': 'nostalgic',
        'wistful': 'nostalgic',
        'sentimental': 'nostalgic',
        'motivated': 'inspired',
        'uplifted': 'inspired',
        'encouraged': 'inspired',
      };
      
      if (moodAssociations[userMood]) {
        return moodAssociations[userMood];
      }
      
      // Default to 'happy' if no matching mood is found
      return 'happy';
    }
  
    // Get recommendations based on user mood
    getRecommendations(userMood) {
      return this.trainedModel.predict(userMood);
    }
    
    // Get random recommendations when no mood is specified
    getRandomRecommendations() {
      const randomMood = this.dataset.moods[Math.floor(Math.random() * this.dataset.moods.length)];
      return this.trainedModel.predict(randomMood);
    }
  }
  
  // Export the model and dataset
  export const moodDataset = moodBasedData;
  export const MoodRecommender = new MoodBasedRecommendationModel(moodBasedData);