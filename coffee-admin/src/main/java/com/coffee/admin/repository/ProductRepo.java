package com.coffee.admin.repository;

import com.coffee.admin.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepo extends JpaRepository<Product, Integer> {

    List<Product> findByProductCategory(String category);

    @Query("SELECT DISTINCT p.productCategory FROM Product p ORDER BY p.productCategory")
    List<String> findDistinctCategories();

    @Query("SELECT DISTINCT p.productGroup FROM Product p ORDER BY p.productGroup")
    List<String> findDistinctGroups();
}
