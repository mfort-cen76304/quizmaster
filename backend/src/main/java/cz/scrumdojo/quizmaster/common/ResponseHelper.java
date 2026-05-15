package cz.scrumdojo.quizmaster.common;

import java.util.Optional;
import org.springframework.http.ResponseEntity;

public class ResponseHelper {

    public static <T> ResponseEntity<T> okOrNotFound(Optional<T> entity) {
        return entity.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }
}
