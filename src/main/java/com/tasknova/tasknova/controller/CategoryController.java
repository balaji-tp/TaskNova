package com.tasknova.tasknova.controller;

import com.tasknova.tasknova.dto.CategoryDTO;
import com.tasknova.tasknova.service.CategoryService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    @Autowired
    private CategoryService categoryService;

    @GetMapping
    public ResponseEntity<List<CategoryDTO>> getCategories(Authentication authentication) {
        return ResponseEntity.ok(categoryService.getCategories(authentication.getName()));
    }

    @PostMapping
    public ResponseEntity<CategoryDTO> createCategory(Authentication authentication, @Valid @RequestBody CategoryDTO dto) {
        return ResponseEntity.ok(categoryService.createCategory(authentication.getName(), dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCategory(Authentication authentication, @PathVariable Long id) {
        categoryService.deleteCategory(authentication.getName(), id);
        return ResponseEntity.noContent().build();
    }
}
