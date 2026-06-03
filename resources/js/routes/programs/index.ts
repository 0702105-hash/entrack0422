import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../wayfinder'
/**
* @see \App\Http\Controllers\ProgramsController::index
 * @see app/Http/Controllers/ProgramsController.php:12
 * @route '/programs'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/programs',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ProgramsController::index
 * @see app/Http/Controllers/ProgramsController.php:12
 * @route '/programs'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProgramsController::index
 * @see app/Http/Controllers/ProgramsController.php:12
 * @route '/programs'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ProgramsController::index
 * @see app/Http/Controllers/ProgramsController.php:12
 * @route '/programs'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ProgramsController::index
 * @see app/Http/Controllers/ProgramsController.php:12
 * @route '/programs'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ProgramsController::index
 * @see app/Http/Controllers/ProgramsController.php:12
 * @route '/programs'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ProgramsController::index
 * @see app/Http/Controllers/ProgramsController.php:12
 * @route '/programs'
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
* @see \App\Http\Controllers\ProgramsController::manage
 * @see app/Http/Controllers/ProgramsController.php:57
 * @route '/programs/manage'
 */
export const manage = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: manage.url(options),
    method: 'get',
})

manage.definition = {
    methods: ["get","head"],
    url: '/programs/manage',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ProgramsController::manage
 * @see app/Http/Controllers/ProgramsController.php:57
 * @route '/programs/manage'
 */
manage.url = (options?: RouteQueryOptions) => {
    return manage.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProgramsController::manage
 * @see app/Http/Controllers/ProgramsController.php:57
 * @route '/programs/manage'
 */
manage.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: manage.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ProgramsController::manage
 * @see app/Http/Controllers/ProgramsController.php:57
 * @route '/programs/manage'
 */
manage.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: manage.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ProgramsController::manage
 * @see app/Http/Controllers/ProgramsController.php:57
 * @route '/programs/manage'
 */
    const manageForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: manage.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ProgramsController::manage
 * @see app/Http/Controllers/ProgramsController.php:57
 * @route '/programs/manage'
 */
        manageForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: manage.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ProgramsController::manage
 * @see app/Http/Controllers/ProgramsController.php:57
 * @route '/programs/manage'
 */
        manageForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: manage.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    manage.form = manageForm
/**
* @see \App\Http\Controllers\ProgramsController::store
 * @see app/Http/Controllers/ProgramsController.php:68
 * @route '/programs'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/programs',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ProgramsController::store
 * @see app/Http/Controllers/ProgramsController.php:68
 * @route '/programs'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProgramsController::store
 * @see app/Http/Controllers/ProgramsController.php:68
 * @route '/programs'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\ProgramsController::store
 * @see app/Http/Controllers/ProgramsController.php:68
 * @route '/programs'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\ProgramsController::store
 * @see app/Http/Controllers/ProgramsController.php:68
 * @route '/programs'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\ProgramsController::update
 * @see app/Http/Controllers/ProgramsController.php:84
 * @route '/programs/{program}'
 */
export const update = (args: { program: string | number } | [program: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/programs/{program}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\ProgramsController::update
 * @see app/Http/Controllers/ProgramsController.php:84
 * @route '/programs/{program}'
 */
update.url = (args: { program: string | number } | [program: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { program: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    program: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        program: args.program,
                }

    return update.definition.url
            .replace('{program}', parsedArgs.program.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProgramsController::update
 * @see app/Http/Controllers/ProgramsController.php:84
 * @route '/programs/{program}'
 */
update.put = (args: { program: string | number } | [program: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\ProgramsController::update
 * @see app/Http/Controllers/ProgramsController.php:84
 * @route '/programs/{program}'
 */
    const updateForm = (args: { program: string | number } | [program: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\ProgramsController::update
 * @see app/Http/Controllers/ProgramsController.php:84
 * @route '/programs/{program}'
 */
        updateForm.put = (args: { program: string | number } | [program: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    update.form = updateForm
/**
* @see \App\Http\Controllers\ProgramsController::destroy
 * @see app/Http/Controllers/ProgramsController.php:100
 * @route '/programs/{program}'
 */
export const destroy = (args: { program: string | number } | [program: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/programs/{program}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\ProgramsController::destroy
 * @see app/Http/Controllers/ProgramsController.php:100
 * @route '/programs/{program}'
 */
destroy.url = (args: { program: string | number } | [program: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { program: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    program: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        program: args.program,
                }

    return destroy.definition.url
            .replace('{program}', parsedArgs.program.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProgramsController::destroy
 * @see app/Http/Controllers/ProgramsController.php:100
 * @route '/programs/{program}'
 */
destroy.delete = (args: { program: string | number } | [program: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\ProgramsController::destroy
 * @see app/Http/Controllers/ProgramsController.php:100
 * @route '/programs/{program}'
 */
    const destroyForm = (args: { program: string | number } | [program: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\ProgramsController::destroy
 * @see app/Http/Controllers/ProgramsController.php:100
 * @route '/programs/{program}'
 */
        destroyForm.delete = (args: { program: string | number } | [program: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroy.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroy.form = destroyForm
const programs = {
    index: Object.assign(index, index),
manage: Object.assign(manage, manage),
store: Object.assign(store, store),
update: Object.assign(update, update),
destroy: Object.assign(destroy, destroy),
}

export default programs