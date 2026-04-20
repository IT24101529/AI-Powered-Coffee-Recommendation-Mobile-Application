package com.coffee.admin;

import com.coffee.admin.model.*;
import com.coffee.admin.repository.*;
import com.coffee.admin.service.*;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

// ═══════════════════════════════════════════════════════════════════════════════
//  TrendService Tests
// ═══════════════════════════════════════════════════════════════════════════════
@ExtendWith(MockitoExtension.class)
class TrendServiceTest {

    @Mock private SalesReceiptRepo salesReceiptRepo;
    @Mock private ProductRepo       productRepo;
    @Mock private TrendScoreRepo    trendScoreRepo;

    @InjectMocks private TrendService trendService;

    @Test
    @DisplayName("recalculateAll – skips when no sales data")
    void recalculate_noData_skips() {
        when(salesReceiptRepo.maxDate()).thenReturn(null);
        trendService.recalculateAll();
        verify(trendScoreRepo, never()).saveAll(any());
    }

    @Test
    @DisplayName("recalculateAll – computes and saves scores")
    void recalculate_withData_savesScores() {
        LocalDate maxDate = LocalDate.of(2019, 4, 30);
        when(salesReceiptRepo.maxDate()).thenReturn(maxDate);
        when(salesReceiptRepo.salesPerProductSince(any())).thenReturn(List.of(new Object[]{1, 50}));
        when(salesReceiptRepo.salesPerProductBetween(any(), any())).thenReturn(List.of(new Object[]{1, 30}));
        when(salesReceiptRepo.quantityPerProduct()).thenReturn(List.of(new Object[]{1, 200}));

        Product p = Product.builder().productId(1).product("Espresso").productCategory("Beverages").build();
        when(productRepo.findAll()).thenReturn(List.of(p));
        when(trendScoreRepo.findByProductId(1)).thenReturn(Optional.empty());

        trendService.recalculateAll();

        ArgumentCaptor<List<TrendScore>> captor = ArgumentCaptor.forClass(List.class);
        verify(trendScoreRepo).saveAll(captor.capture());
        List<TrendScore> saved = captor.getValue();
        assertFalse(saved.isEmpty(), "Should save at least one trend score");
        TrendScore ts = saved.get(0);
        assertEquals(1, ts.getProductId());
        assertNotNull(ts.getTier());
        assertTrue(ts.getTrendScore() >= 0 && ts.getTrendScore() <= 200);
    }

    @Test
    @DisplayName("Tier = TRENDING_UP when growth >= 30%")
    void tier_trending_whenHighGrowth() {
        LocalDate maxDate = LocalDate.of(2019, 4, 30);
        when(salesReceiptRepo.maxDate()).thenReturn(maxDate);
        // recent = 80, prev = 50 → growth = (80-50)/50 * 100 = 60%
        when(salesReceiptRepo.salesPerProductSince(any()))
                .thenAnswer(inv -> {
                    LocalDate from = inv.getArgument(0);
                    if (from.equals(maxDate.minusDays(7))) return List.of(new Object[]{1, 80});
                    return List.of(new Object[]{1, 200});
                });
        when(salesReceiptRepo.salesPerProductBetween(any(), any()))
                .thenReturn(List.of(new Object[]{1, 50}));
        when(salesReceiptRepo.quantityPerProduct()).thenReturn(List.of(new Object[]{1, 200}));

        Product p = Product.builder().productId(1).product("Latte").productCategory("Beverages").build();
        when(productRepo.findAll()).thenReturn(List.of(p));
        when(trendScoreRepo.findByProductId(any())).thenReturn(Optional.empty());

        trendService.recalculateAll();

        ArgumentCaptor<List<TrendScore>> captor = ArgumentCaptor.forClass(List.class);
        verify(trendScoreRepo).saveAll(captor.capture());
        TrendScore ts = captor.getValue().get(0);
        assertEquals("TRENDING_UP", ts.getTier(),
                "Expected TRENDING_UP for 60% growth, got: " + ts.getTier());
    }

    @Test
    @DisplayName("getAllTrends returns DTO list sorted by score")
    void getAllTrends_returnsSortedList() {
        TrendScore t1 = TrendScore.builder().productId(1).productName("A").trendScore(90.0).tier("BESTSELLER").build();
        TrendScore t2 = TrendScore.builder().productId(2).productName("B").trendScore(45.0).tier("TRENDING_UP").build();
        when(trendScoreRepo.findAllByOrderByTrendScoreDesc()).thenReturn(List.of(t1, t2));

        var result = trendService.getAllTrends();
        assertEquals(2, result.size());
        assertEquals("A", result.get(0).getProductName());
        assertEquals(90.0, result.get(0).getTrendScore());
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
//  ChatbotService Tests
// ═══════════════════════════════════════════════════════════════════════════════
@ExtendWith(MockitoExtension.class)
class ChatbotServiceTest {

    @Mock private SalesReceiptRepo salesReceiptRepo;
    @Mock private ProductRepo       productRepo;
    @Mock private TrendScoreRepo    trendScoreRepo;
    @Mock private ChatMessageRepo   chatMessageRepo;
    @Mock private TrendService      trendService;

    @InjectMocks private ChatbotService chatbotService;

    private static final String SESSION = "test-session";

    @BeforeEach
    void setUp() {
        when(chatMessageRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    @DisplayName("Greeting triggers welcome response")
    void chat_greeting_returnsWelcome() {
        var response = chatbotService.chat("hello", SESSION);
        assertNotNull(response);
        assertTrue(response.getReply().toLowerCase().contains("hello") ||
                   response.getReply().contains("Coffee Analytics"), "Should greet back");
    }

    @Test
    @DisplayName("Revenue query returns formatted revenue")
    void chat_revenue_returnsRevenue() {
        when(salesReceiptRepo.totalRevenue()).thenReturn(98765.50);
        when(salesReceiptRepo.totalTransactions()).thenReturn(5000L);

        var response = chatbotService.chat("What is the total revenue?", SESSION);
        assertNotNull(response.getReply());
        assertTrue(response.getReply().contains("98765") || response.getReply().contains("Revenue"),
                "Reply should contain revenue info");
    }

    @Test
    @DisplayName("Help command returns capability list")
    void chat_help_returnsList() {
        var response = chatbotService.chat("help", SESSION);
        assertTrue(response.getReply().contains("Revenue") || response.getReply().contains("best-selling"),
                "Help should list capabilities");
    }

    @Test
    @DisplayName("Unknown input returns fallback guidance")
    void chat_unknown_returnsFallback() {
        var response = chatbotService.chat("xyzabc random stuff", SESSION);
        assertNotNull(response.getReply());
        assertFalse(response.getReply().isBlank());
    }

    @Test
    @DisplayName("Chat persists both user and bot messages")
    void chat_persistsMessages() {
        when(salesReceiptRepo.totalRevenue()).thenReturn(0.0);
        when(salesReceiptRepo.totalTransactions()).thenReturn(0L);

        chatbotService.chat("revenue", SESSION);

        // Verify save called twice: once for user msg, once for bot reply
        verify(chatMessageRepo, times(2)).save(any(ChatMessage.class));
    }

    @Test
    @DisplayName("SessionId is echoed back in response")
    void chat_echoesSessionId() {
        var response = chatbotService.chat("hello", "my-unique-session");
        assertEquals("my-unique-session", response.getSessionId());
    }

    @Test
    @DisplayName("Trending query delegates to TrendService")
    void chat_trending_delegatesToTrendService() {
        when(trendService.getTrendingUp()).thenReturn(List.of());
        var response = chatbotService.chat("what is trending", SESSION);
        assertNotNull(response.getReply());
        verify(trendService).getTrendingUp();
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
//  TrendDTO Tests
// ═══════════════════════════════════════════════════════════════════════════════
class TrendDTOTest {

    @Test
    @DisplayName("Tier badge class maps correctly for each tier")
    void tierBadgeClass_mapsCorrectly() {
        var dto = new com.coffee.admin.dto.TrendDTO();

        dto.setTier("BESTSELLER");
        assertEquals("badge-bestseller", dto.getTierBadgeClass());

        dto.setTier("TRENDING_UP");
        assertEquals("badge-trending", dto.getTierBadgeClass());

        dto.setTier("HIDDEN_GEM");
        assertEquals("badge-gem", dto.getTierBadgeClass());

        dto.setTier("SEASONAL");
        assertEquals("badge-seasonal", dto.getTierBadgeClass());

        dto.setTier(null);
        assertEquals("badge-secondary", dto.getTierBadgeClass());
    }

    @Test
    @DisplayName("Tier label includes emoji prefix")
    void tierLabel_includesEmoji() {
        var dto = new com.coffee.admin.dto.TrendDTO();
        dto.setTier("BESTSELLER");
        assertTrue(dto.getTierLabel().contains("Bestseller"));

        dto.setTier("HIDDEN_GEM");
        assertTrue(dto.getTierLabel().contains("Hidden Gem"));
    }
}
