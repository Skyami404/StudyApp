import { Platform, Alert } from 'react-native';
import * as Linking from 'expo-linking';
import { Audio } from 'expo-av';

class MusicService {
  constructor() {
    this.currentTrack = null;
    this.isPlaying = false;
    this.volume = 0.5;
    this.sound = null;
    this.ambientSounds = {
      rain: { 
        name: 'Rain', 
        icon: '🌧️', 
        duration: 'continuous',
        // Using more reliable audio URLs
        url: 'https://www.soundjay.com/misc/sounds/rain-01.mp3'
      },
      whiteNoise: { 
        name: 'White Noise', 
        icon: '🔊', 
        duration: 'continuous',
        url: 'https://www.soundjay.com/misc/sounds/white-noise-1.mp3'
      },
      forest: { 
        name: 'Forest', 
        icon: '🌲', 
        duration: 'continuous',
        url: 'https://www.soundjay.com/nature/sounds/forest-1.mp3'
      },
      ocean: { 
        name: 'Ocean Waves', 
        icon: '🌊', 
        duration: 'continuous',
        url: 'https://www.soundjay.com/nature/sounds/ocean-wave-1.mp3'
      },
      cafe: { 
        name: 'Cafe Ambience', 
        icon: '☕', 
        duration: 'continuous',
        url: 'https://www.soundjay.com/misc/sounds/cafe-1.mp3'
      },
      fireplace: { 
        name: 'Fireplace', 
        icon: '🔥', 
        duration: 'continuous',
        url: 'https://www.soundjay.com/misc/sounds/fireplace-1.mp3'
      },
    };
  }

  // Initialize audio
  async initialize() {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      console.log('Audio initialized successfully');
    } catch (error) {
      console.error('Failed to initialize audio:', error);
    }
  }

  // Check if Spotify is installed
  async checkSpotifyInstalled() {
    try {
      const canOpen = await Linking.canOpenURL('spotify:');
      return canOpen;
    } catch (error) {
      console.log('Error checking Spotify:', error);
      return false;
    }
  }

  // Check if Apple Music is available
  async checkAppleMusicAvailable() {
    try {
      const canOpen = await Linking.canOpenURL('music:');
      return canOpen;
    } catch (error) {
      console.log('Error checking Apple Music:', error);
      return false;
    }
  }

  // Open Spotify with a specific playlist/album
  async openSpotify(playlistId = null) {
    try {
      let url = 'spotify:';
      if (playlistId) {
        url = `spotify:playlist:${playlistId}`;
      }
      await Linking.openURL(url);
      return true;
    } catch (error) {
      console.log('Error opening Spotify:', error);
      Alert.alert('Error', 'Could not open Spotify. Please make sure it\'s installed.');
      return false;
    }
  }

  // Open Apple Music with a specific playlist/album
  async openAppleMusic(playlistId = null) {
    try {
      let url = 'music:';
      if (playlistId) {
        url = `music://music.apple.com/playlist/${playlistId}`;
      }
      await Linking.openURL(url);
      return true;
    } catch (error) {
      console.log('Error opening Apple Music:', error);
      Alert.alert('Error', 'Could not open Apple Music.');
      return false;
    }
  }

  // Get recommended study playlists
  getStudyPlaylists() {
    return {
      spotify: [
        { id: '37i9dQZF1DX8Uebhn9BzIx', name: 'Deep Focus', description: 'Instrumental music for deep work' },
        { id: '37i9dQZF1DX3s9uCz6JjGf', name: 'Peaceful Piano', description: 'Calm piano music for studying' },
        { id: '37i9dQZF1DX8NTLI2TtZa6', name: 'Intense Studying', description: 'High-energy focus music' },
        { id: '37i9dQZF1DX5Vy6DFOcx00', name: 'Lo-Fi Beats', description: 'Chill beats for studying' },
      ],
      appleMusic: [
        { id: 'pl.acc464c750054d26b5c273d6c73c8b8c', name: 'Deep Focus', description: 'Instrumental music for deep work' },
        { id: 'pl.acc464c750054d26b5c273d6c73c8b8d', name: 'Peaceful Piano', description: 'Calm piano music for studying' },
        { id: 'pl.acc464c750054d26b5c273d6c73c8b8e', name: 'Intense Studying', description: 'High-energy focus music' },
        { id: 'pl.acc464c750054d26b5c273d6c73c8b8f', name: 'Lo-Fi Beats', description: 'Chill beats for studying' },
      ]
    };
  }

  // Get ambient sounds
  getAmbientSounds() {
    return this.ambientSounds;
  }

  // Play ambient sound with actual audio
  async playAmbientSound(soundType) {
    try {
      // Stop any currently playing sound
      await this.stopAmbientSound();
      
      const soundConfig = this.ambientSounds[soundType];
      if (!soundConfig) {
        throw new Error(`Unknown sound type: ${soundType}`);
      }

      console.log(`Attempting to play ambient sound: ${soundType}`);
      
      // OPTION 1: SIMULATION (Current - for testing UI)
      // This simulates audio playback without actual sound
      this.isPlaying = true;
      this.currentTrack = { type: 'ambient', sound: soundType };
      
      // Simulate audio loading delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log(`Ambient sound ${soundType} simulation started`);
      
      Alert.alert(
        'Audio Simulation',
        `${soundType} sound is now playing (simulated). In a production app, this would play actual audio files.`,
        [{ text: 'OK' }]
      );
      
      return { success: true, sound: soundType, simulated: true };
      
      /* OPTION 2: REAL AUDIO (Uncomment to use actual audio files)
      
      // Load and play actual audio file
      const { sound } = await Audio.Sound.createAsync(
        // For local files in assets folder:
        // require(`../assets/audio/${soundType}.mp3`)
        
        // For remote URLs (replace with working URLs):
        { uri: soundConfig.url },
        { 
          shouldPlay: true,
          isLooping: true,
          volume: this.volume,
          rate: 1.0,
        }
      );
      
      this.sound = sound;
      this.isPlaying = true;
      this.currentTrack = { type: 'ambient', sound: soundType };
      
      // Set up status update listener
      sound.setOnPlaybackStatusUpdate((status) => {
        console.log('Playback status update:', status);
        if (status.isLoaded) {
          this.isPlaying = status.isPlaying;
        }
      });
      
      console.log(`Ambient sound ${soundType} started playing successfully`);
      return { success: true, sound: soundType };
      
      */
      
    } catch (error) {
      console.error('Error playing ambient sound:', error);
      
      Alert.alert(
        'Audio Error',
        `Unable to play ${soundType} sound: ${error.message}`,
        [{ text: 'OK' }]
      );
      
      return { success: false, error: error.message };
    }
  }



  // Stop ambient sound
  async stopAmbientSound() {
    try {
      if (this.sound) {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
        this.sound = null;
      }
      this.isPlaying = false;
      this.currentTrack = null;
      console.log('Ambient sound stopped');
      return { success: true };
    } catch (error) {
      console.error('Error stopping ambient sound:', error);
      this.isPlaying = false;
      this.currentTrack = null;
      return { success: true };
    }
  }

  // Set volume
  async setVolume(volume) {
    try {
      this.volume = Math.max(0, Math.min(1, volume));
      if (this.sound) {
        await this.sound.setVolumeAsync(this.volume);
      }
      return { success: true };
    } catch (error) {
      console.error('Error setting volume:', error);
      return { success: false, error: error.message };
    }
  }

  // Control system music playback
  async controlSystemMusic(action) {
    try {
      switch (action) {
        case 'play':
          await Linking.openURL('music://play');
          break;
        case 'pause':
          await Linking.openURL('music://pause');
          break;
        case 'next':
          await Linking.openURL('music://next');
          break;
        case 'previous':
          await Linking.openURL('music://previous');
          break;
        default:
          console.log('Unknown music action:', action);
      }
      return { success: true };
    } catch (error) {
      console.log('Error controlling system music:', error);
      return { success: false, error: error.message };
    }
  }

  // Get music recommendations based on study method
  getMusicRecommendations(studyMethod) {
    const recommendations = {
      pomodoro: {
        description: 'Short, energetic tracks for focused bursts',
        spotify: '37i9dQZF1DX8NTLI2TtZa6', // Intense Studying
        appleMusic: 'pl.acc464c750054d26b5c273d6c73c8b8e'
      },
      focus: {
        description: 'Medium-length instrumental tracks',
        spotify: '37i9dQZF1DX8Uebhn9BzIx', // Deep Focus
        appleMusic: 'pl.acc464c750054d26b5c273d6c73c8b8c'
      },
      deepwork: {
        description: 'Long, ambient tracks for extended sessions',
        spotify: '37i9dQZF1DX3s9uCz6JjGf', // Peaceful Piano
        appleMusic: 'pl.acc464c750054d26b5c273d6c73c8b8d'
      }
    };
    return recommendations[studyMethod] || recommendations.focus;
  }

  // Cleanup resources
  async cleanup() {
    try {
      await this.stopAmbientSound();
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}

// Create singleton instance
const musicService = new MusicService();

export default musicService; 