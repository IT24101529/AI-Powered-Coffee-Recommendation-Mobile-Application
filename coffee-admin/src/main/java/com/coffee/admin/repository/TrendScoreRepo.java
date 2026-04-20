package com.coffee.admin.repository;

import com.coffee.admin.model.TrendScore;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TrendScoreRepo extends JpaRepository<TrendScore, Long> {
    List<TrendScore> findAllByOrderByTrendScoreDesc();
    List<TrendScore> findByTierOrderByTrendScoreDesc(String tier);
    Optional<TrendScore> findByProductId(Integer productId);
    List<TrendScore> findTop10ByOrderByTrendScoreDesc();
}
