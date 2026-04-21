// screens/ChatScreen.js
import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Keyboard, KeyboardAvoidingView, Platform, TextInput,
  LayoutAnimation, UIManager, Image, Alert
} from 'react-native';
import {
  GiftedChat,
  Bubble,
} from 'react-native-gifted-chat';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import axios from 'axios';

// Shared
import { colors as COLORS, typography as FONTS, spacing as SPACING, borderRadius as RADIUS } from '../theme';
import { useSession } from '../hooks/useSession';
import { useCart } from '../context/CartContext';
import API_URLS from '../config/api';

// Feature 2 — Bandara
import MoodBadge from '../components/chat/sentiment/MoodBadge';
import { useSentiment } from '../hooks/useSentiment';

// Feature 3 — Ranasinghe
import WeatherContextBadge  from '../components/chat/context/WeatherContextBadge';
import LocationPickerModal  from '../components/chat/context/LocationPickerModal';
import ContextOverridePanel from '../components/chat/context/ContextOverridePanel';
import { useWeatherContext } from '../hooks/useWeatherContext';

// Feature 4 — Ekanayake
import ProductCard from '../components/chat/products/ProductCard';

// Feature 5 — Ishaak
import PopularNowBanner from '../components/chat/trends/PopularNowBanner';

// Feature 6 — Aaquif
import FeedbackWidget from '../components/chat/feedback/FeedbackWidget';

export default function ChatScreen({ navigation, startupLocation = 'Kandy,LK' }) {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const [messages, setMessages]               = useState([]);
  const [currentMood, setCurrentMood]         = useState(null);
  const [lastProduct, setLastProduct]         = useState(null);
  const [feedbackProduct, setFeedbackProduct] = useState(null);
  const [showFeedback, setShowFeedback]       = useState(false);
  const [showTrending, setShowTrending]       = useState(false);
  const [showLocation, setShowLocation]       = useState(false);
  const [showOverride, setShowOverride]       = useState(false);
  const [strategyUsed, setStrategyUsed]       = useState('hybrid');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [inputText, setInputText]             = useState('');
  const [weatherMinimized, setWeatherMinimized] = useState(false);
  const [trendingMinimized, setTrendingMinimized] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [recommendationCardVersion, setRecommendationCardVersion] = useState(0);
  const [thinkingDots, setThinkingDots] = useState(0);

  // Session management
  const { sessionId, sessionReady } = useSession();
  const { addItem } = useCart();

  // Location Permissions — IT24101529
  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('Location permission denied. Falling back to default.');
          return;
        }

        let locData = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = locData.coords;

        // Reverse geocode to get city name for the weather backend
        let reverse = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (reverse && reverse.length > 0) {
          const city = reverse[0].city || reverse[0].subregion || reverse[0].region;
          const country = reverse[0].isoCountryCode || 'LK';
          if (city) {
            const formattedLoc = `${city},${country}`;
            console.log('Precise location found:', formattedLoc);
            setLocation(formattedLoc);
          }
        }
      } catch (err) {
        console.log('Error getting precise location:', err);
      }
    })();
  }, []);

  // Sentiment hook — Bandara
  const { analyseSentiment } = useSentiment();

  // Context hook — Ranasinghe
  const {
    contextData, loading: weatherLoading, error: weatherError, 
    location, setLocation, fetchContext, overrideContext, clearOverride 
  } = useWeatherContext(sessionId, startupLocation || 'Kandy,LK');

  const normalizeRecommendation = useCallback((rec) => {
    if (!rec || typeof rec !== 'object') return null;

    const name = rec.product_name || rec.name;
    if (!name) return null;

    const rawPrice = typeof rec.price === 'string'
      ? parseFloat(rec.price.replace(/[^\d.]/g, ''))
      : rec.price;

    return {
      product_name: name,
      category: rec.category || 'Specialty',
      price: Number.isFinite(rawPrice) ? rawPrice : 450,
      temperature: rec.temperature || 'Hot',
      description: rec.description || 'A curated coffee recommendation just for you.',
      similarity_score: Number.isFinite(rec.similarity_score) ? rec.similarity_score : 0.78,
      reason: rec.reason || 'It matches your current mood and weather context.',
    };
  }, []);

  const shouldUpdateMoodBadge = useCallback((text, sentimentResult) => {
    const msg = (text || '').trim().toLowerCase();
    if (!msg || !sentimentResult?.mood) return false;

    const controlWords = new Set([
      'hi', 'hello', 'hey', 'ok', 'okay', 'yes', 'no', 'done', 'stop',
      'hot', 'cold', 'customise this', 'show me alternatives', 'yes, order it!',
    ]);
    if (controlWords.has(msg)) return false;

    const hasKeywords = Array.isArray(sentimentResult.keywords_found)
      && sentimentResult.keywords_found.length > 0;

    if (sentimentResult.method === 'greeting') return false;
    if (sentimentResult.method === 'ml_low_confidence') return false;
    if (!hasKeywords && sentimentResult.intensity < 0.7) return false;

    return true;
  }, []);

  // ── Add a bot message to the chat ──────────────────────────
  const addBotMessage = useCallback((text, quickReplies = [], metadata = {}) => {
    const msg = {
      _id:       Math.random().toString(),
      text,
      createdAt: new Date(),
      user:      { _id: 2, name: 'BrewBot' },
      ...metadata,
    };
    if (quickReplies.length > 0) {
      msg.quickReplies = {
        type:   'radio',
        values: quickReplies.map(r => ({ title: r, value: r })),
      };
    }
    // Strip quick replies from ALL previous messages so only the latest bot message has them
    setMessages(prev => {
      const cleaned = prev.map(m => {
        if (m.quickReplies) {
          const { quickReplies: _, ...rest } = m;
          return rest;
        }
        return m;
      });
      return GiftedChat.append(cleaned, [msg]);
    });
  }, []);

  const setRecommendationWithTransition = useCallback((nextRecommendation) => {
    // Smoother layout transition to prevent glitching
    LayoutAnimation.configureNext({
      ...LayoutAnimation.Presets.easeInEaseOut,
      duration: 300,
    });
    setLastProduct(nextRecommendation);
    setRecommendationCardVersion(prev => prev + 1);
  }, []);

  // ── Thinking dot animation ─────────────────────────────────
  useEffect(() => {
    let interval;
    if (isSending) {
      interval = setInterval(() => {
        setThinkingDots(prev => (prev + 1) % 4);
      }, 500);
    } else {
      setThinkingDots(0);
    }
    return () => interval && clearInterval(interval);
  }, [isSending]);

  // ── Handle user sending a message ──────────────────────────
  const onSend = useCallback(async (newMessages = []) => {
    if (isSending) return;

    const userText = newMessages?.[0]?.text?.trim();
    if (!userText) return;

    setIsSending(true);
    setMessages(prev => GiftedChat.append(prev, newMessages));

    // Step 1: Analyse sentiment (Bandara)
    try {
      const sentimentResult = await analyseSentiment(userText, sessionId);
      if (shouldUpdateMoodBadge(userText, sentimentResult)) {
        setCurrentMood(sentimentResult);
      }

      // Step 2: Send message to chatbot core
      const res = await axios.post(`${API_URLS.CHATBOT_API}/chat`, {
        session_id: sessionId,
        message:    userText,
      });

      const { reply, quick_replies, intent, recommendation, state, product } = res.data;
      const normalizedRecommendation = normalizeRecommendation(recommendation);

      // Filter redundant quick replies
      const filteredReplies = (quick_replies || []).filter(r => 
        !(intent === 'Order' && (r === 'Rate Recommendation' || r.title === 'Rate Recommendation'))
      );

      // Show bot reply
      addBotMessage(reply, filteredReplies, {
        product: normalizedRecommendation,
        isFeedback: intent === 'Feedback',
        productName: normalizedRecommendation?.product_name || feedbackProduct?.product_name || lastProduct?.product_name
      });

      if (state === 'DONE') {
        setRecommendationWithTransition(null);
        setShowTrending(false);
        setShowFeedback(false);
      }

      if (state !== 'DONE') {
        if (normalizedRecommendation) {
          setRecommendationWithTransition(normalizedRecommendation);
          setShowTrending(false);
          setStrategyUsed(res.data.strategy_used || 'hybrid');
        } else if (intent === 'Browse' || res.data.show_trending) {
          // If user explicitly asks for trending/menu
          setRecommendationWithTransition(null);
          setShowTrending(true);
        } else {
          setShowTrending(false);
        }
      }

      // After order — show feedback
      if (intent === 'Order') {
        const productForFeedback = normalizedRecommendation || lastProduct;
        
        // Add to cart — Feature Integration
        const cartItem = product || productForFeedback;
        if (cartItem) {
          addItem(cartItem);
          console.log('Product added to cart via Chatbot:', cartItem.productName || cartItem.product_name);
        }

        setFeedbackProduct(productForFeedback);
        setRecommendationWithTransition(null);
        // Note: Inline feedback is now handled via addBotMessage metadata above
      }

    } catch (err) {
      if (err.response) {
        addBotMessage(`⚠️  Backend Error (${err.response.status}): Something went wrong in the chatbot brain.`);
      } else if (err.request) {
        addBotMessage('⚠️  Could not reach the chatbot. Make sure the backend is running and you have an internet connection.');
      } else {
        addBotMessage(`⚠️  Error: ${err.message}`);
      }
    } finally {
      setIsSending(false);
    }
  }, [sessionId, analyseSentiment, addBotMessage, normalizeRecommendation, lastProduct, shouldUpdateMoodBadge, isSending, setRecommendationWithTransition]);

  const handleQuickReply = useCallback((replies = []) => {
    if (isSending) return;
    if (!replies.length) return;

    const selected = replies[0]?.value || replies[0]?.title;
    if (!selected) return;

    onSend([
      {
        _id: Math.random().toString(),
        text: selected,
        createdAt: new Date(),
        user: { _id: 1 },
      },
    ]);
  }, [onSend, isSending]);

  useEffect(() => {
    const onShow = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const onHide = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));

    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, []);

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  useEffect(() => {
    if (startupLocation && startupLocation !== location) {
      setLocation(startupLocation);
    }
  }, [startupLocation]);

  // ── Auto-Greeting: fire once when session + context are ready ──
  const [greetingSent, setGreetingSent] = useState(false);
  useEffect(() => {
    if (!sessionReady || !sessionId || greetingSent) return;
    // Don't wait for context — fire the greeting immediately
    setGreetingSent(true);
    (async () => {
      try {
        const res = await axios.post(`${API_URLS.CHATBOT_API}/session/greeting`, {
          session_id: sessionId,
        });
        const { reply, quick_replies } = res.data;
        if (reply) {
          addBotMessage(reply, quick_replies || []);
        }
      } catch (err) {
        console.log('Auto-greeting failed:', err.message);
        // If it's a 500 error, notify the user. If it's just a network error, show the fallback greeting quietly.
        if (err.response && err.response.status >= 500) {
          addBotMessage('⚠️  Backend greeting failed. Falling back to local mode.');
        }
        addBotMessage('Welcome to Ember Coffee! How are you feeling today?', ['Energetic', 'Tired', 'Stressed', 'Happy', 'Normal']);
      }
    })();
  }, [sessionReady, sessionId, greetingSent, addBotMessage]);

  // ── Show loading until session is ready ────────────────────
  if (!sessionReady) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Starting your session…</Text>
      </SafeAreaView>
    );
  }

  // ── Main render ────────────────────────────────────────────
  const isNightWindow = contextData?.time_of_day === 'Night'
    || contextData?.time_of_day === 'Late Night';
  const compactCondition = contextData?.condition_display
    || (isNightWindow && contextData?.condition === 'Sunny'
      ? 'Clear Night'
      : contextData?.condition);

  const contextLine = contextData
    ? `${compactCondition || 'Weather'} · ${contextData.weather || 'Balanced'}${contextData.temperature_celsius ? ` ${contextData.temperature_celsius.toFixed(1)}°C` : ''}`
    : `Checking weather in ${location}`;

  return (
    <SafeAreaView style={styles.safe}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../assets/Black_Transparent_logo.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.headerRight}>
          {currentMood && (
            <MoodBadge
              mood={currentMood.mood}
              intensity={currentMood.intensity}
            />
          )}
        </View>
      </View>

      <View style={styles.cardToggleRow}>
        <TouchableOpacity
          style={styles.cardToggleBtn}
          onPress={() => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setWeatherMinimized(prev => !prev);
          }}
        >
          <Text style={styles.cardToggleText}>{weatherMinimized ? 'Show Weather' : 'Hide Weather'}</Text>
        </TouchableOpacity>
        {showTrending && (
          <TouchableOpacity
            style={styles.cardToggleBtn}
            onPress={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setTrendingMinimized(prev => !prev);
            }}
          >
            <Text style={styles.cardToggleText}>{trendingMinimized ? 'Show Trending' : 'Hide Trending'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Weather context */}
      {(keyboardVisible || weatherMinimized) ? (
        <View style={styles.compactContextBar}>
          <Text style={styles.compactContextText} numberOfLines={1}>🌤️  {contextLine}</Text>
        </View>
      ) : (
        <WeatherContextBadge
          location={location}
          contextData={contextData}
          loading={weatherLoading}
          error={weatherError}
          onRetry={() => fetchContext(location)}
          onLocationPress={() => setShowLocation(true)}
          onOverridePress={() => setShowOverride(true)}
          onResetPress={() => clearOverride()}
        />
      )}

      {/* Trending banner — Ishaak (only when user is undecided) */}
      {!keyboardVisible && showTrending && !trendingMinimized && (
        <PopularNowBanner
          onSelect={(productName) => {
            setShowTrending(false);
            addBotMessage(`Great choice! Let me tell you about ${productName}…`);
          }}
        />
      )}

      {/* Product recommendation card — Ekanayake (Moved inline, this block removed) */}

      {/* GiftedChat wrapped in KeyboardAvoidingView */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <GiftedChat
          messages={messages}
          onSend={onSend}
          onQuickReply={handleQuickReply}
          user={{ _id: 1 }}
          placeholder="Type a message…"
          renderFooter={() => isSending ? (
            <View style={styles.thinkingContainer}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.thinkingText}>Thinking{'.'.repeat(thinkingDots)}</Text>
            </View>
          ) : null}
          renderCustomView={(props) => {
            const { currentMessage } = props;
            if (currentMessage.product) {
              return (
                <View style={styles.inlineCardContainer}>
                  <ProductCard
                    product={currentMessage.product}
                    onOrder={() => {
                      if (isSending) return;
                      onSend([{ _id: Math.random().toString(), text: 'Yes, order it!', createdAt: new Date(), user: { _id: 1 } }]);
                    }}
                    onAlternatives={() => {
                      if (isSending) return;
                      onSend([{ _id: Math.random().toString(), text: 'Show me alternatives', createdAt: new Date(), user: { _id: 1 } }]);
                    }}
                  />
                </View>
              );
            }
            if (currentMessage.isFeedback) {
              return (
                <View style={styles.inlineCardContainer}>
                  <FeedbackWidget
                    sessionId={sessionId}
                    productName={currentMessage.productName}
                    strategyUsed={strategyUsed}
                    userMood={currentMood?.mood}
                    weatherContext={contextData?.weather}
                    onDone={() => {
                      // Optionally update local state or just let the card stay in history
                    }}
                  />
                </View>
              );
            }
            return null;
          }}
          keyboardShouldPersistTaps="handled"
          alwaysShowSend
          scrollToBottom
          minComposerHeight={40}
          maxComposerHeight={100}
          listViewProps={{
            contentContainerStyle: styles.chatListContent,
            keyboardShouldPersistTaps: 'handled',
            scrollEnabled: true,
          }}
          renderBubble={props => (
            <Bubble
              {...props}
              wrapperStyle={{
                right: { backgroundColor: COLORS.primary, borderRadius: 16 },
                left:  { backgroundColor: COLORS.cream, borderRadius: 16,
                         borderWidth: 1, borderColor: COLORS.accent },
              }}
              textStyle={{
                right: { color: COLORS.cream, fontFamily: FONTS.fonts.regular },
                left:  { color: COLORS.primary, fontFamily: FONTS.fonts.regular },
              }}
            />
          )}
          renderInputToolbar={() => (
            <View style={styles.floatingInputContainer}>
              <View style={styles.inputToolbar}>
                <TextInput
                  style={styles.customComposer}
                  placeholder="Type a message..."
                  placeholderTextColor="#A89F91" // subtle brownish gray
                  value={inputText}
                  onChangeText={setInputText}
                  multiline
                  maxLength={1000}
                />
                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    !inputText.trim() && styles.sendButtonDisabled,
                  ]}
                  disabled={!inputText.trim() || isSending}
                  onPress={() => {
                    if (isSending) return;
                    const text = inputText.trim();
                    if (!text) return;
                    onSend([
                      {
                        _id: Math.random().toString(),
                        text,
                        createdAt: new Date(),
                        user: { _id: 1 },
                      },
                    ]);
                    setInputText('');
                  }}
                >
                  <Ionicons name="send-outline" size={18} color={COLORS.cream} style={styles.sendIcon} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      </KeyboardAvoidingView>

      {/* Feedback widget — Aaquif (Moved inline, this block removed) */}

      {/* Modals — Ranasinghe */}
      <LocationPickerModal
        visible={showLocation}
        currentLocation={location}
        onConfirm={(loc) => { setLocation(loc); fetchContext(loc); }}
        onClose={() => setShowLocation(false)}
      />
      <ContextOverridePanel
        visible={showOverride}
        sessionId={sessionId}
        onApply={overrideContext}
        onClose={() => setShowOverride(false)}
      />

    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex:            1,
    backgroundColor: COLORS.background,
  },
  loadingScreen: {
    flex:            1,
    justifyContent:  'center',
    alignItems:      'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop:  SPACING.md,
    color:      COLORS.textLight,
    fontFamily: FONTS.regular,
    fontSize:   14,
  },
  header: {
    flexDirection:    'row',
    alignItems:       'center',
    paddingHorizontal: SPACING.md,
    paddingVertical:  SPACING.sm,
    backgroundColor:  COLORS.cream,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.accent,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLogo: {
    height: 30,
    width: 120,
  },
  headerRight: {
    width: 140, // Increased to fit MoodBadge perfectly
    alignItems: 'flex-end',
  },
  compactContextBar: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.xs,
    marginBottom: SPACING.xs,
    backgroundColor: COLORS.accent,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.primary,
    opacity: 0.8,
    paddingVertical: 8,
    paddingHorizontal: SPACING.md,
  },
  compactContextText: {
    fontFamily: FONTS.fonts.semiBold,
    fontSize: 12,
    color: COLORS.primary,
  },
  cardToggleRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xs,
  },
  cardToggleBtn: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
  },
  cardToggleText: {
    color: COLORS.textLight,
    fontFamily: FONTS.semiBold,
    fontSize: 11,
  },
  floatingInputContainer: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    paddingBottom: SPACING.lg, // Give it a floating feel above the bottom edge
    backgroundColor: 'transparent',
  },
  inputToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FCFAF8', // Match the provided image cream exactly
    borderRadius: 999,
    paddingLeft: SPACING.lg,
    paddingRight: SPACING.xs,
    paddingVertical: SPACING.xs,
    shadowColor: '#4A3B32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(98, 55, 30, 0.05)',
  },
  customComposer: {
    flex: 1,
    color: COLORS.dark,
    fontFamily: FONTS.fonts.regular,
    fontSize: 16,
    maxHeight: 100,
    paddingTop: 12,
    paddingBottom: 12,
    marginRight: SPACING.sm,
  },
  sendButton: {
    backgroundColor: COLORS.primary, // Dark brown
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendIcon: {
    marginLeft: -2, // Optical alignment for the paper plane
    marginTop: 2,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  chatListContent: {
    paddingBottom: SPACING.md,
  },
  thinkingContainer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  thinkingText: {
    marginLeft: SPACING.sm,
    fontSize: 12,
    color: COLORS.textLight,
    fontFamily: FONTS.fonts?.regular || 'sans-serif',
    fontStyle: 'italic',
  },
  inlineCardContainer: {
    width: 280, 
    padding: 2,
    alignSelf: 'center',
    marginBottom: 4,
  },
});