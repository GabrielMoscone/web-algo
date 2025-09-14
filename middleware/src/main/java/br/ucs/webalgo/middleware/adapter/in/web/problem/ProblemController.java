package br.ucs.webalgo.middleware.adapter.in.web.problem;

import br.ucs.webalgo.middleware.adapter.in.web.problem.dto.ProblemDataResponse;
import br.ucs.webalgo.middleware.adapter.in.web.problem.dto.SearchByKeyResponse;
import br.ucs.webalgo.middleware.adapter.in.web.problem.mapper.ProblemDataMapper;
import br.ucs.webalgo.middleware.adapter.in.web.problem.mapper.SearchByKeyMapper;
import br.ucs.webalgo.middleware.application.port.in.problem.ProblemUseCase;
import br.ucs.webalgo.middleware.application.port.in.problem.dto.FetchByCodeCommand;
import br.ucs.webalgo.middleware.application.port.in.problem.dto.SearchByKeyCommand;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.List;

@RestController
@RequestMapping("/api/v1/web-algo/problems")
public class ProblemController {

    private final ProblemUseCase useCase;
    private final SearchByKeyMapper searchByKeyMapper;
    private final ProblemDataMapper problemDataMapper;

    public ProblemController(ProblemUseCase useCase, SearchByKeyMapper searchByKeyMapper, ProblemDataMapper problemDataMapper) {
        this.useCase = useCase;
        this.searchByKeyMapper = searchByKeyMapper;
        this.problemDataMapper = problemDataMapper;
    }

    @GetMapping("/key/{key}")
    public Mono<ResponseEntity<SearchByKeyResponse>> searchByKey(@PathVariable String key,
                                                                 @CookieValue(name = "sessionid") String sessionId,
                                                                 @CookieValue(name = "name") String userName) {
        SearchByKeyCommand command = searchByKeyMapper.toCommand(key, sessionId, userName);

        return useCase.searchProblemByKey(command)
                .map(searchByKeyMapper::toResponse)
                .map(resp -> ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(resp))
                .onErrorResume(IllegalStateException.class, e ->
                        Mono.just(ResponseEntity.status(401).body(new SearchByKeyResponse(List.of(), e.getMessage()))))
                .onErrorResume(IllegalArgumentException.class, e ->
                        Mono.just(ResponseEntity.unprocessableEntity().body(new SearchByKeyResponse(List.of(), e.getMessage()))));
    }

    @GetMapping("/{code}/details")
    public Mono<ResponseEntity<ProblemDataResponse>> fetchProblemDetails(@PathVariable String code,
                                                                         @CookieValue(name = "sessionid") String sessionId,
                                                                         @CookieValue(name = "name") String userName) {

        FetchByCodeCommand command = problemDataMapper.toCommand(code, sessionId, userName);

        return useCase.fetchProblemData(command)
                .map(problemDataMapper::toResponse)
                .map(resp -> ResponseEntity.ok()
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(resp))
                .onErrorResume(IllegalStateException.class, e -> Mono.just(ResponseEntity.status(401).build()))
                .onErrorResume(IllegalArgumentException.class, e -> Mono.just(ResponseEntity.unprocessableEntity().build()));
    }

}