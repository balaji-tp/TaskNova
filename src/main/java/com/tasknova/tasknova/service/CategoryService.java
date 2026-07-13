package com.tasknova.tasknova.service;

import com.tasknova.tasknova.dto.CategoryDTO;
import com.tasknova.tasknova.model.Category;
import com.tasknova.tasknova.model.User;
import com.tasknova.tasknova.repository.CategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CategoryService {

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private UserService userService;

    public List<CategoryDTO> getCategories(String userEmail) {
        User user = userService.getUserByEmail(userEmail);
        return categoryRepository.findByUserId(user.getId()).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public CategoryDTO createCategory(String userEmail, CategoryDTO dto) {
        User user = userService.getUserByEmail(userEmail);
        Category category = Category.builder()
                .user(user)
                .name(dto.getName())
                .colorHex(dto.getColorHex() != null ? dto.getColorHex() : "#6C5CE7")
                .build();

        categoryRepository.save(category);
        return convertToDTO(category);
    }

    public void deleteCategory(String userEmail, Long categoryId) {
        User user = userService.getUserByEmail(userEmail);
        Category category = categoryRepository.findByIdAndUserId(categoryId, user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found or access denied"));

        categoryRepository.delete(category);
    }

    public CategoryDTO convertToDTO(Category category) {
        return CategoryDTO.builder()
                .id(category.getId())
                .name(category.getName())
                .colorHex(category.getColorHex())
                .build();
    }
}
