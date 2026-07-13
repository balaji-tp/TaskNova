package com.tasknova.tasknova.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryDTO {
    private Long id;

    @NotBlank(message = "Category name is required")
    @Size(max = 50, message = "Category name must be under 50 characters")
    private String name;

    @Size(max = 7, message = "Color hex code must be valid (e.g. #FFFFFF)")
    private String colorHex;
}
