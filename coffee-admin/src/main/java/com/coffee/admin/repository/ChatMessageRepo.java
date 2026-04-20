package com.coffee.admin.repository;

import com.coffee.admin.model.ChatMessage;
import com.coffee.admin.model.SalesOutlet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface ChatMessageRepo extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findBySessionIdOrderBySentAtAsc(String sessionId);

    @Transactional
    void deleteBySessionId(String sessionId);
}
