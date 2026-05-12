package cz.scrumdojo.quizmaster.question;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import com.fasterxml.jackson.databind.ObjectMapper;

@Converter(autoApply = false)
public class JsonbStringConverter implements AttributeConverter<String, String> {
    private static final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public String convertToDatabaseColumn(String attribute) {
        // Pokud je null nebo prázdné, vrať prázdný JSON objekt
        if (attribute == null || attribute.isBlank()) return "{}";
        // Pokud je validní JSON, vrať jak je
        return attribute;
    }

    @Override
    public String convertToEntityAttribute(String dbData) {
        // Vracíme jak je, protože v kódu pracujeme se Stringem
        return dbData;
    }
}