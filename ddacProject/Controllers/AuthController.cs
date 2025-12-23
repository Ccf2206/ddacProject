using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ddacProject.Services;
using ddacProject.DTOs;
using System.Security.Claims;

namespace ddacProject.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly AuthService _authService;

        public AuthController(AuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            var (success, token, user, errorMessage) = await _authService.LoginAsync(request.Email, request.Password);

            if (!success)
            {
                return Unauthorized(new { message = errorMessage });
            }

            var userDto = new UserDto
            {
                UserId = user!.UserId,
                Name = user.Name,
                Email = user.Email,
                Phone = user.Phone,
                ProfilePhotoUrl = user.ProfilePhotoUrl,
                Status = user.Status,
                RoleName = user.Role.RoleName,
                RoleId = user.RoleId,
                Role = new AuthRoleDto
                {
                    RoleId = user.Role.RoleId,
                    RoleName = user.Role.RoleName,
                    Permissions = user.Role.Permissions
                }
            };

            return Ok(new LoginResponse
            {
                Token = token!,
                User = userDto
            });
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            var (success, user, errorMessage) = await _authService.RegisterAsync(
                request.Name, request.Email, request.Password, request.Phone, request.RoleId);

            if (!success)
            {
                return BadRequest(new { message = errorMessage });
            }

            return Ok(new { message = "User registered successfully", userId = user!.UserId });
        }

        [Authorize]
        [HttpGet("me")]
        public async Task<IActionResult> GetCurrentUser()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userIdClaim == null)
            {
                return Unauthorized();
            }

            var user = await _authService.GetUserByIdAsync(int.Parse(userIdClaim));
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            var userDto = new UserDto
            {
                UserId = user.UserId,
                Name = user.Name,
                Email = user.Email,
                Phone = user.Phone,
                ProfilePhotoUrl = user.ProfilePhotoUrl,
                Status = user.Status,
                RoleName = user.Role.RoleName,
                RoleId = user.RoleId,
                Role = new AuthRoleDto
                {
                    RoleId = user.Role.RoleId,
                    RoleName = user.Role.RoleName,
                    Permissions = user.Role.Permissions
                }
            };

            return Ok(userDto);
        }
    }
}
