package com.datafood_backend.controller;

import com.datafood_backend.dto.DecreaseStockRequest;
import com.datafood_backend.dto.SupplyDTO;
import com.datafood_backend.service.SupplyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/supplies")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
public class SupplyController {

    private final SupplyService service;

    @GetMapping
    public ResponseEntity<List<SupplyDTO>> getAll(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) Integer categoryId) {
        return ResponseEntity.ok(service.getAll(name, categoryId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SupplyDTO> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    public ResponseEntity<SupplyDTO> create(@RequestBody SupplyDTO dto) {
        return ResponseEntity.ok(service.create(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SupplyDTO> update(@PathVariable Integer id, @RequestBody SupplyDTO dto) {
        return ResponseEntity.ok(service.update(id, dto));
    }

    @PatchMapping("/{id}/decrease")
    public ResponseEntity<Void> decreaseStock(@PathVariable Integer id,
                                              @RequestBody DecreaseStockRequest req) {
        service.decreaseStock(id, req);
        return ResponseEntity.ok().build();
    }
}