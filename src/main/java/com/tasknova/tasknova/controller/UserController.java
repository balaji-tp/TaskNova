package com.tasknova.tasknova.controller;

import com.tasknova.tasknova.dto.UserDTO;
import com.tasknova.tasknova.model.User;
import com.tasknova.tasknova.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping("/me")
    public ResponseEntity<UserDTO> getMe(Authentication authentication) {
        User user = userService.getUserByEmail(authentication.getName());
        return ResponseEntity.ok(UserDTO.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .avatarUrl(user.getAvatarUrl())
                .darkMode(user.getDarkMode())
                .createdAt(user.getCreatedAt())
                .build());
    }

    @PutMapping("/me")
    public ResponseEntity<UserDTO> updateMe(Authentication authentication, @Valid @RequestBody UserDTO dto) {
        return ResponseEntity.ok(userService.updateProfile(authentication.getName(), dto));
    }
}
