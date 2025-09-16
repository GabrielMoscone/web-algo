package br.ucs.webalgo.middleware.adapter.in.web.solution;

import br.ucs.webalgo.middleware.adapter.in.web.solution.dto.CreateSolutionRequest;
import br.ucs.webalgo.middleware.adapter.in.web.solution.dto.CreateSolutionResponse;
import br.ucs.webalgo.middleware.adapter.in.web.solution.dto.SolutionDataResponse;
import br.ucs.webalgo.middleware.adapter.in.web.solution.mapper.CreateSolutionMapper;
import br.ucs.webalgo.middleware.adapter.in.web.solution.mapper.SolutionDataMapper;
import br.ucs.webalgo.middleware.application.port.in.solution.SolutionUseCase;
import br.ucs.webalgo.middleware.application.port.in.solution.dto.CreateSolutionCommand;
import br.ucs.webalgo.middleware.application.port.in.solution.dto.FetchSolutionCommand;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/v1/web-algo/solutions")
public class SolutionController {

    private final SolutionUseCase solutionUseCase;
    private final SolutionDataMapper solutionDataMapper;
    private final CreateSolutionMapper createSolutionMapper;

    public SolutionController(SolutionUseCase solutionUseCase, SolutionDataMapper solutionDataMapper, CreateSolutionMapper createSolutionMapper) {
        this.solutionUseCase = solutionUseCase;
        this.solutionDataMapper = solutionDataMapper;
        this.createSolutionMapper = createSolutionMapper;
    }

    @GetMapping("/{code}/details")
    public Mono<ResponseEntity<SolutionDataResponse>> fetchSolutionDetails(@PathVariable String code,
                                                                           @CookieValue("sessionid") String sessionId,
                                                                           @CookieValue("name") String userName) {

        FetchSolutionCommand command = solutionDataMapper.toCommand(code, sessionId, userName);

        return solutionUseCase.fetchSolutionData(command)
                .map(solutionDataMapper::toResponse)
                .map(ResponseEntity::ok)
                .onErrorResume(IllegalStateException.class, e -> Mono.just(ResponseEntity.status(401).build()))
                .onErrorResume(IllegalArgumentException.class, e -> Mono.just(ResponseEntity.unprocessableEntity().build()));
    }

    @PostMapping
    public Mono<ResponseEntity<CreateSolutionResponse>> create(@RequestBody CreateSolutionRequest req,
                                                               @CookieValue("sessionid") String sessionId,
                                                               @CookieValue("name") String userName) {

        CreateSolutionCommand command = createSolutionMapper.toCommand(req.problemCode(), sessionId, userName);

        return solutionUseCase.createSolution(command)
                .map(createSolutionMapper::toResponse)
                .map(ResponseEntity::ok)
                .onErrorResume(IllegalArgumentException.class, e -> Mono.just(ResponseEntity.unprocessableEntity().build()));
    }
}
