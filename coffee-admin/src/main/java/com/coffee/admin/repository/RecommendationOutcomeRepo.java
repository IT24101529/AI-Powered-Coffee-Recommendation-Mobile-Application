package com.coffee.admin.repository;

import com.coffee.admin.model.RecommendationOutcome;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface RecommendationOutcomeRepo extends JpaRepository<RecommendationOutcome, Long> {

    List<RecommendationOutcome> findBySessionId(String sessionId);

    List<RecommendationOutcome> findByOutcome(String outcome);

    @Transactional
    void deleteBySessionId(String sessionId);
}
