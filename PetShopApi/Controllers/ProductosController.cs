using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PetShopApi.DAL;

[ApiController]
[Route("api/[controller]")]
[AllowAnonymous]
public class ProductosController : ControllerBase
{
    private readonly ProductosDal _productosDAL;
    public ProductosController(ProductosDal productosDAL)
    {
        _productosDAL = productosDAL;
    }

    [HttpGet]
    public IActionResult Get()
    {
        var (salida, productos) = _productosDAL.ObtenerProductos();
        return Ok(new { salida, productos });
    }
}
