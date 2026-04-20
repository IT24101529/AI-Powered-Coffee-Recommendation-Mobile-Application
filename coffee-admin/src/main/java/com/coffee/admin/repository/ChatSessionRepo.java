package com.coffee.admin.repository;

import com.coffee.admin.model.ChatSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatSessionRepo extends JpaRepository<ChatSession, String> {

    List<ChatSession> findAllByOrderByStartedAtDesc();

    List<ChatSession> findByStatusOrderByStartedAtDesc(String status);

    List<ChatSession> findByOutcomeOrderByStartedAtDesc(String outcome);

    @Query("SELECT COUNT(s) FROM ChatSession s WHERE s.status = 'OPEN'")
    Long countOpenSessions();

    @Query("SELECT COUNT(s) FROM ChatSession s WHERE s.outcome = 'RECOMMENDED'")
    Long countRecommendedSessions();
}
