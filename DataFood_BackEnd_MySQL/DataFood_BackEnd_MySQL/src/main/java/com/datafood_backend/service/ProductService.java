package com.datafood_backend.service;

import com.datafood_backend.dto.ProductDTO;
import com.datafood_backend.model.Product;
import com.datafood_backend.model.ProductCategory;
import com.datafood_backend.repository.ProductCategoryRepository;
import com.datafood_backend.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository        productRepo;
    private final ProductCategoryRepository categoryRepo;

    /**
     * Lista con filtros opcionales combinables:
     *  categoryId → filtra por categoría
     *  status     → 1 (ACTIVO) | 0 (INACTIVO)
     *  search     → búsqueda parcial por nombre
     *  sortAZ     → true ordena A-Z
     */
    public List<ProductDTO> getAll(Integer categoryId, Integer status,
                                   String search, Boolean sortAZ) {

        String safeName = (search != null) ? search : "";
        boolean hasCat    = categoryId != null;
        boolean hasStatus = status != null;

        List<Product> result;

        if (hasCat && hasStatus) {
            result = productRepo
                    .findByProductCategory_ProductCategoryIdAndStatusAndNameContainingIgnoreCase(
                            categoryId, status, safeName);

        } else if (hasCat) {
            if (Boolean.TRUE.equals(sortAZ)) {
                result = productRepo.findByCategoryOrderByNameAZ(categoryId);
                if (!safeName.isBlank())
                    result = result.stream()
                            .filter(p -> p.getName().toLowerCase().contains(safeName.toLowerCase()))
                            .collect(Collectors.toList());
            } else {
                result = productRepo
                        .findByProductCategory_ProductCategoryIdAndNameContainingIgnoreCase(
                                categoryId, safeName);
            }

        } else if (hasStatus) {
            result = productRepo.findByStatusAndNameContainingIgnoreCase(status, safeName);

        } else if (!safeName.isBlank()) {
            result = productRepo.findByNameContainingIgnoreCase(safeName);

        } else if (Boolean.TRUE.equals(sortAZ)) {
            result = productRepo.findAllOrderByNameAZ();

        } else {
            result = productRepo.findAll();
        }

        return result.stream().map(this::toDTO).collect(Collectors.toList());
    }

    public ProductDTO getById(Integer id) {
        return toDTO(findOrThrow(id));
    }

    public ProductDTO create(ProductDTO dto) {
        ProductCategory cat = findCatOrThrow(dto.getProductCategoryId());

        Product product = new Product();
        product.setName(dto.getName().trim());
        product.setPrice(dto.getPrice());
        product.setStatus(1);           // siempre ACTIVO al crear
        product.setProductCategory(cat);
        product.setDescription(dto.getDescription());
        return toDTO(productRepo.save(product));
    }

    public ProductDTO update(Integer id, ProductDTO dto) {
        Product product = findOrThrow(id);
        ProductCategory cat = findCatOrThrow(dto.getProductCategoryId());

        product.setName(dto.getName().trim());
        product.setPrice(dto.getPrice());
        product.setProductCategory(cat);
        product.setDescription(dto.getDescription());
        if (dto.getStatus() != null) {
            product.setStatus(dto.getStatus());
        }

        return toDTO(productRepo.save(product));
    }

    /**
     * Alterna entre 1 (ACTIVO) y 0 (INACTIVO).
     * Usado por el toggle switch del frontend.
     */
    public ProductDTO toggleStatus(Integer id) {
        Product product = findOrThrow(id);
        product.setStatus(product.getStatus() == 1 ? 0 : 1);
        return toDTO(productRepo.save(product));
    }

    public void delete(Integer id) {
        findOrThrow(id);
        productRepo.deleteById(id);
    }

    public void updateImageUrl(Integer id, String imageUrl) {
        Product product = findOrThrow(id);
        product.setImageUrl(imageUrl);
        productRepo.save(product);
    }

    // ── helpers ──────────────────────────────────────────────

    private Product findOrThrow(Integer id) {
        return productRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado: " + id));
    }

    private ProductCategory findCatOrThrow(Integer catId) {
        return categoryRepo.findById(catId)
                .orElseThrow(() -> new RuntimeException("Categoría no encontrada: " + catId));
    }

    private ProductDTO toDTO(Product p) {
        ProductDTO dto = new ProductDTO();
        dto.setProductId(p.getProductId());
        dto.setName(p.getName());
        dto.setPrice(p.getPrice());
        dto.setStatus(p.getStatus());
        dto.setProductCategoryId(p.getProductCategory().getProductCategoryId());
        dto.setCategoryName(p.getProductCategory().getName());
        dto.setImageUrl(p.getImageUrl());
        dto.setDescription(p.getDescription());
        return dto;
    }
}
