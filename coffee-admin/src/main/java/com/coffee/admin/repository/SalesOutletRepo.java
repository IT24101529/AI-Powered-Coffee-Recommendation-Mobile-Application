package com.coffee.admin.repository;

import com.coffee.admin.model.SalesOutlet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SalesOutletRepo extends JpaRepository<SalesOutlet, Integer> {}
