import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../wayfinder'
/**
* @see \App\Http\Controllers\PredictionController::index
 * @see app/Http/Controllers/PredictionController.php:11
 * @route '/predictions'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/predictions',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PredictionController::index
 * @see app/Http/Controllers/PredictionController.php:11
 * @route '/predictions'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\PredictionController::index
 * @see app/Http/Controllers/PredictionController.php:11
 * @route '/predictions'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\PredictionController::index
 * @see app/Http/Controllers/PredictionController.php:11
 * @route '/predictions'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\PredictionController::index
 * @see app/Http/Controllers/PredictionController.php:11
 * @route '/predictions'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\PredictionController::index
 * @see app/Http/Controllers/PredictionController.php:11
 * @route '/predictions'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\PredictionController::index
 * @see app/Http/Controllers/PredictionController.php:11
 * @route '/predictions'
 */
        indexForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    index.form = indexForm
/**
* @see \App\Http\Controllers\PredictionRetrainController::retrain
 * @see app/Http/Controllers/PredictionRetrainController.php:11
 * @route '/predictions/retrain'
 */
export const retrain = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: retrain.url(options),
    method: 'post',
})

retrain.definition = {
    methods: ["post"],
    url: '/predictions/retrain',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\PredictionRetrainController::retrain
 * @see app/Http/Controllers/PredictionRetrainController.php:11
 * @route '/predictions/retrain'
 */
retrain.url = (options?: RouteQueryOptions) => {
    return retrain.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\PredictionRetrainController::retrain
 * @see app/Http/Controllers/PredictionRetrainController.php:11
 * @route '/predictions/retrain'
 */
retrain.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: retrain.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\PredictionRetrainController::retrain
 * @see app/Http/Controllers/PredictionRetrainController.php:11
 * @route '/predictions/retrain'
 */
    const retrainForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: retrain.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\PredictionRetrainController::retrain
 * @see app/Http/Controllers/PredictionRetrainController.php:11
 * @route '/predictions/retrain'
 */
        retrainForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: retrain.url(options),
            method: 'post',
        })
    
    retrain.form = retrainForm
const predictions = {
    index: Object.assign(index, index),
retrain: Object.assign(retrain, retrain),
}

export default predictions